import Searchbar from "./Searchbar" 
import Hospitals from "./Hospitals"
import Calendar from "./Calender" 

import { useState, useEffect } from "react" 
import axios from 'axios';

export default function HomeBloodBooking({ pageType }) {
  const prefix = pageType === "home" ? "home_" : "hospital_" 
  const [step, setStep] = useState(()=> localStorage.getItem("step") || "hospitals"); 
  const [hospitals, setHospitals] = useState([]);
  const [urgentHospitals, setUrgentHospitals] = useState([]);
  const [regularHospitals, setRegularHospitals] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [appointments, setAppointments] = useState([]);
  const [timeSlots, setTimeSlots] = useState([]);
  const [availableSlots, setAvailableSlots] = useState(0);

  const [hospital, setHospital] = useState(() => {
     const stored = localStorage.getItem(prefix + "hospital");
    try {
      return stored ? JSON.parse(stored) : null;
    } catch (e) {
      console.warn("Invalid JSON in hospital localStorage:", stored);
      return null;
    }
  }); 
  const [date, setDate] = useState(() => localStorage.getItem("date") || null); 

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
        })
        .finally(() => setLoading(false));
    }
  }, [pageType]);

  useEffect(() => {
    localStorage.setItem("step", step);
    if (hospital) localStorage.setItem(prefix + "hospital", JSON.stringify(hospital));
    if (date) localStorage.setItem("date", date);
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
    
  const handleBack = () => { 
    if (step === "calendar") setStep("hospitals"); 
  };

    
  return ( 
  <> 
    <div className="booking"> 
      <Searchbar /> 
      
      {/* Step 1: Hospitals list */} 
      {step === "hospitals" && ( 
        <Hospitals 
          onSelect={(h) => { 
            setHospital(h); 
            setStep("calendar"); 
           
          }}
          showHospitals={pageType === "home" ? hospitals : []}
          urgentHospitals={pageType === "home" ? urgentHospitals : []}
          regularHospitals={pageType === "home" ? regularHospitals : []}
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
          setHomeVisitData = {setHomeVisitData}
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