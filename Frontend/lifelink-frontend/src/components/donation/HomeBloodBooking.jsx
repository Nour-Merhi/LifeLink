import Searchbar from "./Searchbar" 
import Hospitals from "./Hospitals"
import Calendar from "./Calender" 
import Timeslots from "./Timeslots"
import HomeBloodForm from "./HomeBloodForm"

import { useState, useEffect } from "react" 
import { useNavigate } from "react-router-dom"

export default function HomeBloodBooking() { 
  const [step, setStep] = useState(localStorage.getItem("step") || "hospitals"); 
  const [hospital, setHospital] = useState(localStorage.getItem("hospital") || null); 
  const [date, setDate] = useState(localStorage.getItem("date") || null); 
  const [time, setTime] = useState(localStorage.getItem("time") || null); 
  const [form, setForm] = useState(localStorage.getItem("form") || null);

  const navigate = useNavigate();
  
  useEffect(() => { 
    localStorage.setItem("step", step); 
    
    if (hospital) localStorage.setItem("hospital", hospital); 
    if (date) localStorage.setItem("date", date); 
    if (time) localStorage.setItem("time", time); 
    if (form) localStorage.setItem("form", form);
  }, [step, hospital, date, time, form]); 
    
    const handleBack = () => { 
      if (step === "timeslots") setStep("calendar"); 
      else if (step === "calendar") setStep("hospitals"); 
    };

    
  return ( 
  <> 
    <div className="booking"> 
      <Searchbar /> 
      
      {/* Step 1: Hospitals list */} 
      {step === "hospitals" && ( 
        <Hospitals onSelect={(h) => { 
          setHospital(h); 
          setStep("calendar"); 
        }} /> 
      )} 
      
      {/* Step 2: Calendar step */} 
      {step === "calendar" && ( 
        <Calendar 
          hospital={hospital} 
          onSelectDate={(d) => { 
            setDate(d); }} 
        /> 
      )} 
      
      {/* Step 3: Timeslots */} 
      {step === "timeslots" && ( 
        <Timeslots 
          page= "home"
          selectedDate={date} 
          hospital={hospital}
           
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