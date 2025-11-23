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
  const [filteredHospitals, setFilteredHospitals] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const hospitalsToShow = searchQuery.trim() === "" ? showHospitals : filteredHospitals;
  
  //Hospital Appointment data setting
  const [hospitalAppt, setHospitalAppt] = useState({
    hospital_name: hospital ? hospital.name : '',
    appointment_time: time || '',
    appointment_date: date || '',
  })
  
  useEffect(() => {
    localStorage.setItem(prefix + "step", step)
    if (hospital) localStorage.setItem(prefix + "hospital", JSON.stringify(hospital))
    if (date) localStorage.setItem(prefix + "date", date)
    if (time) localStorage.setItem(prefix + "time", time)
  }, [step, hospital, date, time, prefix])
      
  //Getting Hospitals
  useEffect (()=> {
    axios.get("http://localhost:8000/api/hospital")
    .then((res)=> {
      setShowHospitals(res.data)
      setFilteredHospitals(res.data);
    })
    .catch((error)=>{
      console.error("Error fetching hospitals:", error)
    })
  }, [])

  //Setting hospital appointment data
  useEffect(() => {
    setHospitalAppt((prev) => ({
      ...prev,
      hospital_name: hospital ? hospital.name : "",
      appointment_time: time || '',
      appointment_date: date || '',
    }));
  }, [hospital, time, date]);


  const handleBack = () => {
    if (step === "calendar") setStep("hospitals")
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
  
  console.log(hospitalAppt)
  return (
    <div className="booking"> 
      <Searchbar 
        onSearch = { handleSearch }
      /> 
      
      {/* Step 1: Hospitals list */} 
      {step === "hospitals" && ( 
        <Hospitals 
          showHospitals={hospitalsToShow}
          searchQuery={ searchQuery }
          onSelect={(h) => { 
            setHospital(h); 
            setStep("calendar"); 
          }}
        /> 
      )} 
      
      {/* Step 2: Calendar step */} 
      {step === "calendar" && ( 
        <Calendar 
          pageType= {pageType}
          hospital={hospital} 
          setStep = {setStep}
          setTime = {setTime}
          thankMessHospital = {thankMessHospital}
          hospitalAppt = {hospitalAppt}
          setThankMessHospital = {setThankMessHospital}
          onSelectDate={(d) => { 
            setDate(d); }} 
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
  )
}
