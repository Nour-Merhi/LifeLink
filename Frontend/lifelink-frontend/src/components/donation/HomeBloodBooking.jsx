import Searchbar from "./Searchbar" 
import Hospitals from "./Hospitals"
import Calendar from "./Calender" 

import { useState, useEffect } from "react" 
import axios from 'axios';

export default function HomeBloodBooking({ pageType }) {
  const prefix = pageType === "home" ? "home_" : "hospital_" 
  const [step, setStep] = useState(()=> localStorage.getItem(prefix + "step") || "hospitals"); 
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

  const [hospital, setHospital] = useState(() => {
     const stored = localStorage.getItem(prefix + "hospital");
    try {
      return stored ? JSON.parse(stored) : null;
    } catch (e) {
      console.warn("Invalid JSON in hospital localStorage:", stored);
      return null;
    }
  }); 
  const [date, setDate] = useState(() => localStorage.getItem(prefix + "date") || null); 

  const [homeVisitData, setHomeVisitData] = useState ({
    hospital_name: hospital ? hospital.name : '',
    appointment_time: '',
    appointment_date: date || '',
    home_form_data: {}
  })
  
   // Fetch hospitals with home appointments
  useEffect(() => {
    if (pageType === "home") {
      setLoading(true);
      setError("");
      
      axios.get('http://localhost:8000/api/blood/home_donation')
        .then((res) => {
          console.log('Home donation API response:', res.data);
          const hospitalsData = res.data.hospitals || res.data || [];
          const urgentData = res.data.urgent_hospitals || [];
          const regularData = res.data.regular_hospitals || [];
          
          const hospitalsArray = Array.isArray(hospitalsData) ? hospitalsData : [];
          const urgentArray = Array.isArray(urgentData) ? urgentData : [];
          const regularArray = Array.isArray(regularData) ? regularData : [];
          
          setHospitals(hospitalsArray);
          setUrgentHospitals(urgentArray);
          setRegularHospitals(regularArray);
          setFilteredHospitals(hospitalsArray);
          
          if (hospitalsArray.length === 0) {
            console.warn('No hospitals found with home donation appointments');
          }
        })
        .catch(err => {
          console.error('Error fetching home appointment hospitals:', err);
          console.error('Error response:', err.response);
          setError(err.response?.data?.message || err.message || "Failed to load hospitals with home appointments");
          setHospitals([]);
          setUrgentHospitals([]);
          setRegularHospitals([]);
          setFilteredHospitals([]);
        })
        .finally(() => setLoading(false));
    }
  }, [pageType]);

  useEffect(() => {
    localStorage.setItem(prefix + "step", step);
    if (hospital) localStorage.setItem(prefix + "hospital", JSON.stringify(hospital));
    if (date) localStorage.setItem(prefix + "date", date);
  }, [step, hospital, date, prefix]);
  
  // Fetch appointments when hospital is selected
  useEffect(() => {
    if (hospital && hospital.id && pageType === "home") {
      setLoading(true);
      
      // Build URL with appointment_type query parameter if available
      const appointmentType = hospital.appointment_type; // 'urgent' or 'regular'
      const url = appointmentType 
        ? `http://localhost:8000/api/blood/home_donation/${hospital.id}?appointment_type=${appointmentType}`
        : `http://localhost:8000/api/blood/home_donation/${hospital.id}`;
      
      axios.get(url)
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
          setAvailableSlots(0);
        })
        .finally(() => setLoading(false));
    }
  }, [hospital, pageType]);

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
      localStorage.removeItem(prefix + "date");
      localStorage.removeItem(prefix + "hospital");
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
        <Hospitals 
          onSelect={(h) => { 
            setHospital(h); 
            setStep("calendar"); 
           
          }}
          showHospitals={pageType === "home" ? hospitalsToShow : []}
          urgentHospitals={pageType === "home" ? urgentHospitals : []}
          regularHospitals={pageType === "home" ? regularHospitals : []}
          searchQuery={searchQuery}
        /> 
      )} 
      
      {/* Step 2: Calendar step */} 
      {step === "calendar" && hospital && ( 
        <Calendar 
          pageType={ pageType }
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