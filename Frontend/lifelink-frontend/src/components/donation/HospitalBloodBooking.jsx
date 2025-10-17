import Hospitals from "./Hospitals"
import Calendar from "./Calender"
import Timeslots from "./Timeslots"
import Searchbar from "./Searchbar"

import { useState, useEffect } from "react"

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

  return (
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
