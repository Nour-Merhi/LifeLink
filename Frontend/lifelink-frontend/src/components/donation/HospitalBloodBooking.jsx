import Hospitals from "./Hospitals"
import Calendar from "./Calender"
import Searchbar from "./Searchbar"

import { useState, useEffect } from "react"
import axios from "axios";
import { useAuth } from "../../context/AuthContext";

export default function HospitalBloodBooking({ pageType }) {
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

  const [step, setStep] = useState("hospitals")
  const [date, setDate] = useState(null)
  const [time, setTime] = useState(null)
  
  const [hospital, setHospital] = useState(null);

  const [thankMessHospital, setThankMessHospital] = useState(false);
  const [showHospitals, setShowHospitals] = useState([]);
  const [urgentHospitals, setUrgentHospitals] = useState([]);
  const [regularHospitals, setRegularHospitals] = useState([]);
  const [filteredHospitals, setFilteredHospitals] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [appointments, setAppointments] = useState([]);
  const [timeSlots, setTimeSlots] = useState([]);
  const [availableSlots, setAvailableSlots] = useState(0);
  const hospitalsToShow = searchQuery.trim() === "" ? showHospitals : filteredHospitals;
  
  //Hospital Appointment data setting
  const [hospitalAppt, setHospitalAppt] = useState({
    hospital_name: hospital ? hospital.name : '',
    hospital_id: hospital ? hospital.id : null,
    hospital: hospital || null, // Store full hospital object
    appointment_time: time || '',
    appointment_date: date || '',
  })

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

    // Migrate legacy keys once per scope
    ["step", "date", "time", "hospital"].forEach(migrate);

    const storedStep = localStorage.getItem(scopedKey("step")) || "hospitals";
    const storedDate = localStorage.getItem(scopedKey("date")) || null;
    const storedTime = localStorage.getItem(scopedKey("time")) || null;
    const storedHospital = localStorage.getItem(scopedKey("hospital"));

    setStep(storedStep);
    setDate(storedDate);
    setTime(storedTime);

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
    if (time) setTime(null);
    localStorage.removeItem(scopedKey("hospital"));
    localStorage.removeItem(scopedKey("date"));
    localStorage.removeItem(scopedKey("time"));
    localStorage.removeItem(scopedKey("step"));
    // legacy clean-up (if any)
    localStorage.removeItem(legacyKey("hospital"));
    localStorage.removeItem(legacyKey("date"));
    localStorage.removeItem(legacyKey("time"));
    localStorage.removeItem(legacyKey("step"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEligible]);
  
  useEffect(() => {
    localStorage.setItem(scopedKey("step"), step)
    if (hospital) localStorage.setItem(scopedKey("hospital"), JSON.stringify(hospital))
    if (date) {
      localStorage.setItem(scopedKey("date"), date)
    }
    if (time) localStorage.setItem(prefix + "time", time)
    if (time) localStorage.setItem(scopedKey("time"), time)
  }, [step, hospital, date, time, storagePrefix])
  
  // Clear date when hospital changes (especially important for urgent appointments)
  useEffect(() => {
    if (hospital?.appointment_type === 'urgent') {
      // Clear any old date when urgent hospital is selected
      const today = new Date();
      const pad = (n) => n.toString().padStart(2, "0");
      const todayStr = `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`;
      // Date will be set by Calendar component when it loads
    }
  }, [hospital?.id, hospital?.appointment_type])
      
  const fetchHospitals = () => {
    if (pageType !== "hospital") return;
    setLoading(true);
    setError("");

    axios.get('http://localhost:8000/api/blood/hospital_donation')
      .then((res) => {
        const hospitalsData = res.data.hospitals || res.data || [];
        const urgentData = res.data.urgent_hospitals || [];
        const regularData = res.data.regular_hospitals || [];

        const hospitalsArray = Array.isArray(hospitalsData) ? hospitalsData : [];
        const urgentArray = Array.isArray(urgentData) ? urgentData : [];
        const regularArray = Array.isArray(regularData) ? regularData : [];

        setShowHospitals(hospitalsArray);
        setUrgentHospitals(urgentArray);
        setRegularHospitals(regularArray);
        setFilteredHospitals(hospitalsArray);
      })
      .catch(err => {
        console.error('Error fetching hospital appointment hospitals:', err);
        setError(err.response?.data?.message || err.message || "Failed to load hospitals with hospital donation appointments");
        setShowHospitals([]);
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

  // Fetch appointments when hospital is selected for hospital donation
  useEffect(() => {
    if (hospital && hospital.id && pageType === "hospital") {
      setLoading(true);
      
      const appointmentType = hospital.appointment_type; // 'urgent' or 'regular'
      const url = appointmentType 
        ? `http://localhost:8000/api/blood/hospital_donation/${hospital.id}?appointment_type=${appointmentType}`
        : `http://localhost:8000/api/blood/hospital_donation/${hospital.id}`;
      
      axios.get(url)
        .then((res) => {
          const appointmentsData = res.data.appointments || [];
          const timeSlotsData = res.data.time_slots || [];
          const totalSlots = res.data.total_slots || 0;
          
          setAppointments(appointmentsData);
          setTimeSlots(timeSlotsData);
          setAvailableSlots(totalSlots);
          
          // For urgent appointments, auto-set today's date when appointments load
          // Only set if date is not already set to prevent loops
          if (hospital.appointment_type === 'urgent' && !date) {
            const today = new Date();
            const pad = (n) => n.toString().padStart(2, "0");
            const todayStr = `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`;
            setDate(todayStr);
            setHospitalAppt(prev => ({
              ...prev,
              appointment_date: todayStr
            }));
          }
        })
        .catch(err => {
          console.error('Error fetching hospital appointments:', err);
          setAppointments([]);
          setAvailableSlots(0);
        })
        .finally(() => setLoading(false));
    }
  }, [hospital, pageType]);

  //Setting hospital appointment data
  useEffect(() => {
    setHospitalAppt((prev) => {
      // Only update if values actually changed to prevent unnecessary re-renders
      const newData = {
      hospital_name: hospital ? hospital.name : "",
      hospital_id: hospital ? hospital.id : null,
      hospital: hospital || null,
      appointment_time: time || '',
      appointment_date: date || '',
      };
      
      // Check if anything actually changed
      if (
        prev.hospital_name === newData.hospital_name &&
        prev.hospital_id === newData.hospital_id &&
        prev.appointment_time === newData.appointment_time &&
        prev.appointment_date === newData.appointment_date &&
        prev.hospital?.id === newData.hospital?.id
      ) {
        return prev; // Return same object if nothing changed
      }
      
      return newData;
    });
  }, [hospital, time, date]);


  const handleBack = () => {
    if (step === "calendar") {
      setStep("hospitals");
      setDate(null);
      setTime(null);
      setHospital(null);
      // Clear appointments and related state
      setAppointments([]);
      setTimeSlots([]);
      setAvailableSlots(0);
      // Reset hospital appointment data
      setHospitalAppt({
        hospital_name: '',
        hospital_id: null,
        hospital: null,
        appointment_time: '',
        appointment_date: '',
      });
      // Clear localStorage
      localStorage.removeItem(scopedKey("date"));
      localStorage.removeItem(scopedKey("time"));
      localStorage.removeItem(scopedKey("hospital"));
      // Also clear legacy keys if present
      localStorage.removeItem(legacyKey("date"));
      localStorage.removeItem(legacyKey("time"));
      localStorage.removeItem(legacyKey("hospital"));
    }
  }

  const handleSearch = (term) => {
    setSearchQuery(term);

    if (term.trim() === "") {
      setFilteredHospitals(showHospitals);
    } else {
      const filtered = showHospitals.filter(h =>
        h.name.toLowerCase().includes(term.toLowerCase())
      );
      setFilteredHospitals(filtered);
    }
  };
  
  return (
    <div className="booking"> 
      <Searchbar 
        onSearch = { handleSearch }
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
          showHospitals={hospitalsToShow}
          urgentHospitals={pageType === "hospital" ? urgentHospitals : []}
          regularHospitals={pageType === "hospital" ? regularHospitals : []}
          searchQuery={ searchQuery }
          onSelect={(h) => { 
            if (!isEligible) return;
            setHospital(h); 
            setStep("calendar"); 
          }}
        /> 
        </>
      )} 
      
      {/* Step 2: Calendar step */} 
      {step === "calendar" && hospital && ( 
        <Calendar 
          pageType= {pageType}
          storagePrefix={storagePrefix}
          hospital={hospital} 
          appointments={appointments}
          timeSlots={timeSlots}
          availableSlots={availableSlots}
          setStep = {setStep}
          setTime = {setTime}
          thankMessHospital = {thankMessHospital}
          hospitalAppt = {hospitalAppt}
          setThankMessHospital = {setThankMessHospital}
          onSelectDate={(d) => { 
            // Only update if date actually changed to prevent loops
            if (d !== date) {
              setDate(d);
            }
          }} 
        /> 
      )} 
        
        {/* Back button - hide when modal/form is open */} 
        {step !== "hospitals" &&( 
          <button 
            id="go-back-btn" 
            onClick={handleBack}
          >⬅ Back</button> 
        )} 
      </div>
  )
}
