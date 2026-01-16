import Hospitals from "./Hospitals"
import Calendar from "./Calender"
import Searchbar from "./Searchbar"

import { useState, useEffect } from "react"
import axios from "axios";

export default function HospitalBloodBooking({ pageType }) {
  const prefix = pageType === "home" ? "home_" : "hospital_"

  const [step, setStep] = useState(() =>localStorage.getItem(prefix + "step") || "hospitals")
  const [date, setDate] = useState(() => localStorage.getItem(prefix + "date") || null)
  const [time, setTime] = useState(() => localStorage.getItem(prefix + "time") || null)
  
  const [hospital, setHospital] = useState(()=> {
     const stored = localStorage.getItem(prefix + "hospital");
    try {
      return stored ? JSON.parse(stored) : null;
    } catch (e) {
      console.warn("Invalid JSON in hospital localStorage:", stored);
      return null;
    }
  });

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
  
  useEffect(() => {
    localStorage.setItem(prefix + "step", step)
    if (hospital) localStorage.setItem(prefix + "hospital", JSON.stringify(hospital))
    if (date) {
      localStorage.setItem(prefix + "date", date)
    }
    if (time) localStorage.setItem(prefix + "time", time)
  }, [step, hospital, date, time, prefix])
  
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
      
  //Getting Hospitals with Hospital Blood Donation appointments
  useEffect(() => {
    if (pageType === "hospital") {
      setLoading(true);
      setError("");
      
      axios.get('http://localhost:8000/api/blood/hospital_donation')
        .then((res) => {
          console.log('Hospital donation API response:', res.data);
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
          
          if (hospitalsArray.length === 0) {
            console.warn('No hospitals found with hospital donation appointments');
          }
        })
        .catch(err => {
          console.error('Error fetching hospital appointment hospitals:', err);
          console.error('Error response:', err.response);
          setError(err.response?.data?.message || err.message || "Failed to load hospitals with hospital donation appointments");
          setShowHospitals([]);
          setUrgentHospitals([]);
          setRegularHospitals([]);
          setFilteredHospitals([]);
        })
        .finally(() => setLoading(false));
    }
  }, [pageType])

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
      localStorage.removeItem(prefix + "date");
      localStorage.removeItem(prefix + "time");
      localStorage.removeItem(prefix + "hospital");
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
        <Hospitals 
          showHospitals={hospitalsToShow}
          urgentHospitals={pageType === "hospital" ? urgentHospitals : []}
          regularHospitals={pageType === "hospital" ? regularHospitals : []}
          searchQuery={ searchQuery }
          onSelect={(h) => { 
            setHospital(h); 
            setStep("calendar"); 
          }}
        /> 
      )} 
      
      {/* Step 2: Calendar step */} 
      {step === "calendar" && hospital && ( 
        <Calendar 
          pageType= {pageType}
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
