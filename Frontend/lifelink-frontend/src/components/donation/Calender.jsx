import { useState } from "react";
import Timeslots from "./Timeslots";
import timeslots from "../../../timeSlots";


export default function CalendarStep({ 
    onSelectDate, 
    pageType, 
    thankMessHospital, 
    setThankMessHospital,
    setStep,
    setTime,
    hospitalAppt
}) {
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth(); 

  // days in month
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay(); // weekday of 1st
  const currentDay = new Date().getDate();

  const [selected, setSelected] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);

  const days = [];
  for (let i = 0; i < firstDay; i++) days.push(null); // empty slots
  for (let d = 1; d <= daysInMonth; d++) days.push(d);
   
return (
    <div className="calendar-container">
            <div className="calendar-step">
                    <div className="select-date">
                            <h2 className="font-semibold text-xl">Select Date</h2>
                            <h2 className="font-light">{today.toLocaleString("default", { month: "long" })} {year}</h2>
                    </div>

        <div className="text-center grid grid-cols-7 gap-3">
            {["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map((day) => (
                <div key={day} className="mb-4 font-light">{day}</div>
            ))}

            {days.map((d, i) => (
                <div id="dates"
                    key={i}
                    className={`p-2 m-1 text-center rounded cursor-pointer ${
                            !d
                                ? ""
                                : d < currentDay
                                ? "text-gray-300 cursor-not-allowed"
                                : d === selected
                                ? " bg-gradient-to-r from-red-500 to-red-800 font-bold text-white"
                                : ""
                        }`}
                    style={{
                        background:
                            d && d !== selected && d >= currentDay
                                ? "transparent"
                                : undefined
                    }}
                    onClick={() => {
                        if (!d || d < currentDay) return;
                        setSelected(d);

                        const pad = (n) => n.toString().padStart(2, "0");
                        const dateStr = `${year}-${pad(month + 1)}-${pad(d)}`; // "YYYY-MM-DD"
                        setSelectedDate(dateStr);

                        // Also pass string to parent callback
                        onSelectDate(dateStr);
                    }}
                >
                    {d || ""}
                </div>
            ))}
        </div>
        </div>

            {/*time slots here */}
        <div className="timeslot-panel">
            {selected ? (
                    <>
                        <p>Available Dates</p>
                        <Timeslots 
                            timeslots={timeslots} 
                            selectedDate = {selectedDate}
                            pageType = {pageType}
                            setStep = {setStep}
                            setTime = {setTime} 
                            hospitalAppt ={hospitalAppt}
                            thankMessHospital = {thankMessHospital}
                            setThankMessHospital = {setThankMessHospital}
                        />

                    </>
            ) : (
                <p>Select Date First</p>
            )}
        </div>
    </div>
);
}