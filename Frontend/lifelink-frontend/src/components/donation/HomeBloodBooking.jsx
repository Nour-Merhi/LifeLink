import Searchbar from "./Searchbar" 
import Hospitals from "./Hospitals"
import Calendar from "./Calender" 

import { useState, useEffect } from "react" 
import api from "../../api/axios";
import { useAuth } from "../../context/AuthContext";

export default function HomeBloodBooking({ pageType }) {
  const prefix = pageType === "home" ? "home_" : "hospital_" 
  const { user } = useAuth();
  const userScope = user?.id ? `u${user.id}_` : "guest_";
  const storagePrefix = `${prefix}${userScope}`;
  const scopedKey = (k) => `${storagePrefix}${k}`;
  const legacyKey = (k) => `${prefix}${k}`;

  // Eligibility (56-day rule). If no last donation in backend → eligible.
  const computeEligibility = () => {
    const raw = user?.donor?.last_donation;
    if (!raw) return { eligible: true, daysRemaining: 0, lastDonation: null };
    const last = new Date(raw);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    last.setHours(0, 0, 0, 0);
    const daysSince = Math.floor((today - last) / (1000 * 60 * 60 * 24));
    if (!Number.isFinite(daysSince)) return { eligible: true, daysRemaining: 0, lastDonation: null };
    const remaining = Math.max(0, 56 - daysSince);
    return { eligible: remaining === 0, daysRemaining: remaining, lastDonation: raw };
  };
  const eligibility = computeEligibility();
  const isEligible = eligibility.eligible;

  const [step, setStep] = useState("hospitals"); 
  const [hospitals, setHospitals] = useState([]);
  const [urgentHospitals, setUrgentHospitals] = useState([]);
  const [regularHospitals, setRegularHospitals] = useState([]);
  const [filteredHospitals, setFilteredHospitals] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [appointments, setAppointments] = useState([]);
  const [timeSlots, setTimeSlots] = useState([]);
  const [availableSlots, setAvailableSlots] = useState(0);
  const hospitalsToShow = searchQuery.trim() === "" ? hospitals : filteredHospitals;

  const [hospital, setHospital] = useState(null); 
  const [date, setDate] = useState(null); 

  const [homeVisitData, setHomeVisitData] = useState ({
    hospital_name: hospital ? hospital.name : '',
    appointment_time: '',
    appointment_date: date || '',
    home_form_data: {}
  })
  
  const fetchHospitals = () => {
    if (pageType !== "home") return;
    setLoading(true);
    setError("");

    api.get('/api/blood/home_donation')
      .then((res) => {
        const responseData = res.data || {};
        const hospitalsData = responseData.hospitals || [];
        const urgentData = responseData.urgent_hospitals || [];
        const regularData = responseData.regular_hospitals || [];

        const hospitalsArray = Array.isArray(hospitalsData) ? hospitalsData : [];
        const urgentArray = Array.isArray(urgentData) ? urgentData : [];
        const regularArray = Array.isArray(regularData) ? regularData : [];

        setHospitals(hospitalsArray);
        setUrgentHospitals(urgentArray);
        setRegularHospitals(regularArray);
        setFilteredHospitals(hospitalsArray);
      })
      .catch(err => {
        console.error('Error fetching home appointment hospitals:', err);
        setError(err.response?.data?.message || err.message || "Failed to load hospitals with home appointments");
        setHospitals([]);
        setUrgentHospitals([]);
        setRegularHospitals([]);
        setFilteredHospitals([]);
      })
      .finally(() => setLoading(false));
  };

  // Fetch hospitals on mount + whenever we return to the hospitals step
  useEffect(() => {
    if (step === "hospitals") fetchHospitals();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageType, step]);

  // Rehydrate booking state from storage (scoped to user + booking type)
  useEffect(() => {
    const migrate = (k) => {
      const sk = scopedKey(k);
      const lk = legacyKey(k);
      if (!localStorage.getItem(sk) && localStorage.getItem(lk)) {
        localStorage.setItem(sk, localStorage.getItem(lk));
        localStorage.removeItem(lk);
      }
    };

    ["step", "date", "hospital"].forEach(migrate);

    const storedStep = localStorage.getItem(scopedKey("step")) || "hospitals";
    const storedDate = localStorage.getItem(scopedKey("date")) || null;
    const storedHospital = localStorage.getItem(scopedKey("hospital"));

    setStep(storedStep);
    setDate(storedDate);

    if (storedHospital) {
      try {
        setHospital(JSON.parse(storedHospital));
      } catch (e) {
        console.warn("Invalid JSON in hospital localStorage:", storedHospital);
        setHospital(null);
      }
    } else {
      setHospital(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storagePrefix]);

  // If user is not eligible, prevent jumping to calendar (even via localStorage)
  useEffect(() => {
    if (isEligible) return;
    if (step !== "hospitals") setStep("hospitals");
    if (hospital) setHospital(null);
    if (date) setDate(null);
    localStorage.removeItem(scopedKey("hospital"));
    localStorage.removeItem(scopedKey("date"));
    localStorage.removeItem(scopedKey("step"));
    // legacy clean-up (if any)
    localStorage.removeItem(legacyKey("hospital"));
    localStorage.removeItem(legacyKey("date"));
    localStorage.removeItem(legacyKey("step"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEligible]);

  useEffect(() => {
    localStorage.setItem(scopedKey("step"), step);
    if (hospital) localStorage.setItem(scopedKey("hospital"), JSON.stringify(hospital));
    if (date) localStorage.setItem(scopedKey("date"), date);
  }, [step, hospital, date, storagePrefix]);
  
  // Function to fetch appointments (can be called from multiple places)
  const fetchAppointments = () => {
    if (hospital && hospital.id && pageType === "home") {
      setLoading(true);
      
      // Build URL with appointment_type query parameter if available
      const appointmentType = hospital.appointment_type; // 'urgent' or 'regular'
      const url = appointmentType 
        ? `/api/blood/home_donation/${hospital.id}?appointment_type=${appointmentType}`
        : `/api/blood/home_donation/${hospital.id}`;
      
      api.get(url)
        .then((res) => {
          const appointmentsData = res.data.appointments || [];
          const timeSlotsData = res.data.time_slots || [];
          const totalSlots = res.data.total_slots || 0;
          
          setAppointments(appointmentsData);
          setTimeSlots(timeSlotsData);
          setAvailableSlots(totalSlots);
          
          // Store time slots for Timeslots component
          setHomeVisitData((prev) => ({
            ...prev,
            time_slots: timeSlotsData
          }));
        })
        .catch(err => {
          console.error('Error fetching hospital appointments:', err);
          setAppointments([]);
          setTimeSlots([]);
          setAvailableSlots(0);
        })
        .finally(() => setLoading(false));
    }
  };

  // Fetch appointments when hospital is selected
  useEffect(() => {
    fetchAppointments();
  }, [hospital, pageType]);

  // Refresh appointments when returning to calendar step (to show updated booking status)
  useEffect(() => {
    if (step === "calendar" && hospital && hospital.id && pageType === "home") {
      // Refresh appointments when calendar step is active (e.g., after booking)
      fetchAppointments();
    }
  }, [step, pageType]);

  useEffect(() => {
    setHomeVisitData((prev) => ({
      ...prev,
      hospital_name: hospital ? hospital.name : "",
      appointment_date: date || "",
    }));
  }, [hospital, date]);
    
  const handleSearch = (term) => {
    setSearchQuery(term);

    if (term.trim() === "") {
      setFilteredHospitals(hospitals);
    } else {
      const filtered = hospitals.filter(h =>
        h.name.toLowerCase().includes(term.toLowerCase())
      );
      setFilteredHospitals(filtered);
    }
  };
    
  const handleBack = () => { 
    if (step === "calendar") {
      setStep("hospitals");
      setDate(null);
      setHospital(null);
      // Clear appointments and related state
      setAppointments([]);
      setTimeSlots([]);
      setAvailableSlots(0);
      // Reset home visit data
      setHomeVisitData({
        hospital_name: '',
        appointment_time: '',
        appointment_date: '',
        home_form_data: {}
      });
      // Clear localStorage
      localStorage.removeItem(scopedKey("date"));
      localStorage.removeItem(scopedKey("hospital"));
      // Also clear legacy keys if present
      localStorage.removeItem(legacyKey("date"));
      localStorage.removeItem(legacyKey("hospital"));
    }
  };

    
  return ( 
  <> 
    <div className="booking"> 
      <Searchbar 
        onSearch={handleSearch}
      /> 
      
      {/* Step 1: Hospitals list */} 
      {step === "hospitals" && ( 
        <>
          {!isEligible && (
            <div style={{ margin: "10px 0 14px", padding: "12px 14px", borderRadius: 8, border: "1px solid #fecaca", background: "#fef2f2", color: "#991b1b" }}>
              You’re not eligible to donate yet. Please wait <strong>{eligibility.daysRemaining}</strong> more day{eligibility.daysRemaining !== 1 ? "s" : ""} before booking.
            </div>
          )}
          <Hospitals 
          disableSelection={!isEligible}
          onSelect={(h) => { 
            if (!isEligible) return;
            setHospital(h); 
            setStep("calendar"); 
          }}
          showHospitals={pageType === "home" ? hospitalsToShow : []}
          urgentHospitals={pageType === "home" ? urgentHospitals : []}
          regularHospitals={pageType === "home" ? regularHospitals : []}
          searchQuery={searchQuery}
          /> 
        </>
      )} 
      
      {/* Step 2: Calendar step */} 
      {step === "calendar" && hospital && ( 
        <Calendar 
          pageType={ pageType }
          storagePrefix={storagePrefix}
          hospital={hospital} 
          appointments={appointments}
          timeSlots={timeSlots}
          availableSlots={availableSlots}
          setStep={setStep}
          setTime={() => {}} // Not used for home bookings but required by Calendar
          thankMessHospital={false}
          setThankMessHospital={() => {}}
          hospitalAppt={null}
          onSelectDate={(d) => { 
            setDate(d);
          }} 
        /> 
      )} 
      

        {/* Back button */} 
        {step !== "hospitals" && ( 
          <button 
            id="go-back-btn" 
            onClick={handleBack}
          >⬅ Back</button> 
        )} 
      </div> 
    </> 
  ); 
}