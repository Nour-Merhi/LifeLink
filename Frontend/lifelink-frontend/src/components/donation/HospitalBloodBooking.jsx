import Hospitals from "./Hospitals"
import Calendar from "./Calender"
import Timeslots from "./Timeslots"
import Searchbar from "./Searchbar"

import { useState, useEffect } from "react"
import axios from "axios";

export default function HospitalBloodBooking({ pageType }) {
  const prefix = pageType === "home" ? "home_" : "hospital_"

  const [thankMessHospital, setThankMessHospital] = useState(false);

  const [step, setStep] = useState(localStorage.getItem(prefix + "step") || "hospitals")
  const [hospital, setHospital] = useState(localStorage.getItem(prefix + "hospital") || null)
  const [date, setDate] = useState(localStorage.getItem(prefix + "date") || null)
  const [time, setTime] = useState(localStorage.getItem(prefix + "time") || null)

  useEffect(() => {
    localStorage.setItem(prefix + "step", step)
    if (hospital) localStorage.setItem(prefix + "hospital", hospital)
    if (date) localStorage.setItem(prefix + "date", date)
    if (time) localStorage.setItem(prefix + "time", time)
  }, [step, hospital, date, time, prefix])

  const handleBack = () => {
    if (step === "calendar") setStep("hospitals")
  }

  const [showHospitals, setShowHospitals] = useState([]);
  const [filteredHospitals, setFilteredHospitals] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const hospitalsToShow = searchQuery.trim() === "" ? showHospitals : filteredHospitals;
  
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
          thankMessHospital = {thankMessHospital}
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
