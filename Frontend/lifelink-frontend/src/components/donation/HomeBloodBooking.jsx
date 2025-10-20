import Searchbar from "./Searchbar" 
import Hospitals from "./Hospitals"
import Calendar from "./Calender" 

import { useState, useEffect } from "react" 

export default function HomeBloodBooking({ pageType }) { 
  const [step, setStep] = useState(()=> localStorage.getItem("step") || "hospitals"); 

  const [hospital, setHospital] = useState(() => {
    const stored = localStorage.getItem("hospital");
    return stored ? JSON.parse(stored) : null;
  }); 
  const [date, setDate] = useState(() => localStorage.getItem("date") || null); 

  const [homeVisitData, setHomeVisitData] = useState ({
    hospital_name: hospital ? hospital.name : '',
    appointment_time: '',
    appointment_date: date || '',
    home_form_data: {}
  })
  
   useEffect(() => {
    localStorage.setItem("step", step);
    if (hospital) localStorage.setItem("hospital", JSON.stringify(hospital));
    if (date) localStorage.setItem("date", date);
  }, [step, hospital, date]);
  
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
        /> 
      )} 
      
      {/* Step 2: Calendar step */} 
      {step === "calendar" && ( 
        <Calendar 
          pageType={ pageType }
          hospital={hospital} 
          setHomeVisitData = {setHomeVisitData}
          onSelectDate={(d) => { 
            setDate(d);
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
    </> 
  ); 
}