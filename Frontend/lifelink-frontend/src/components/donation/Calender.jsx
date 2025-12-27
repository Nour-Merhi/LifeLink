import { useState, useEffect } from "react";
import Timeslots from "./Timeslots";
import timeslots from "../../../timeSlots";


export default function CalendarStep({ 
    onSelectDate, 
    pageType, 
    thankMessHospital, 
    setThankMessHospital,
    setStep,
    setTime,
    hospitalAppt,
    hospital,
    appointments = [],
    availableSlots = 0
}) {

  // days in month
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay(); // weekday of 1st
  const currentDay = new Date().getDate();

  const [selected, setSelected] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);

  // Get all dates that have appointments for this hospital
  const getAvailableDates = () => {
    if ((pageType !== "home" && pageType !== "hospital") || !appointments || appointments.length === 0) {
      return new Set();
    }
    
    // Extract unique dates from appointments
    const dateSet = new Set();
    appointments.forEach(apt => {
      if (apt.appointment_date) {
        // Format date to YYYY-MM-DD (handle both Date objects and strings)
        let dateStr;
        if (apt.appointment_date instanceof Date) {
          dateStr = apt.appointment_date.toISOString().split('T')[0];
        } else if (typeof apt.appointment_date === 'string') {
          // Handle YYYY-MM-DD format or YYYY-MM-DD HH:MM:SS format or timestamp
          // Remove time portion if present
          dateStr = apt.appointment_date.split('T')[0].split(' ')[0];
        }
        
        if (dateStr) {
          // Also check if this date has any time slots with valid data
          const slots = apt.time_slots || [];
          if (slots && slots.length > 0) {
            // Check if there's at least one valid slot (either string or object with start)
            const hasValidSlot = slots.some(slot => {
              if (!slot) return false;
              if (typeof slot === 'string') return slot.length > 0;
              if (typeof slot === 'object') {
                const slotObj = slot;
                return slotObj.start || slotObj.time || Object.keys(slotObj).length > 0;
              }
              return false;
            });
            if (hasValidSlot) {
              dateSet.add(dateStr);
            }
          }
        }
      }
    });
    
    return dateSet;
  };

  const availableDates = getAvailableDates();

  // Check if a date has appointments
  const hasAppointments = (day) => {
    if (!day || day < currentDay) return false;
    const pad = (n) => n.toString().padStart(2, "0");
    const dateStr = `${year}-${pad(month + 1)}-${pad(day)}`;
    return availableDates.has(dateStr);
  };

  // Reset selection when appointments change (hospital changes)
  useEffect(() => {
    if (pageType === "home" || pageType === "hospital") {
      setSelected(null);
      setSelectedDate(null);
    }
  }, [appointments, pageType]);

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

            {days.map((d, i) => {
                const dateHasAppointments = hasAppointments(d);
                const isPastDate = d && d < currentDay;
                const isSelected = d === selected;
                const isToday = d === currentDay;
                
                return (
                    <div id="dates"
                        key={i}
                        className={`p-2 m-1 text-center rounded ${
                            !d
                                ? ""
                                : isPastDate
                                ? "text-gray-300 cursor-not-allowed opacity-40"
                                : !dateHasAppointments && d >= currentDay
                                ? "text-gray-400 cursor-not-allowed opacity-50 muted-date"
                                : isSelected
                                ? "bg-gradient-to-red from-red-500 to-red-800 font-bold text-white cursor-pointer"
                                : isToday && dateHasAppointments
                                ? "border-2 border-red-500 cursor-pointer hover:bg-red-50"
                                : dateHasAppointments
                                ? "cursor-pointer hover:bg-red-50 border border-gray-200"
                                : ""
                        }`}
                        style={{
                            background:
                                d && !isSelected && d >= currentDay && dateHasAppointments
                                    ? "transparent"
                                    : undefined
                        }}
                        onClick={() => {
                            if (!d || d < currentDay || !dateHasAppointments) return;
                            setSelected(d);

                            const pad = (n) => n.toString().padStart(2, "0");
                            const dateStr = `${year}-${pad(month + 1)}-${pad(d)}`; // "YYYY-MM-DD"
                            setSelectedDate(dateStr);

                            // Also pass string to parent callback
                            if (onSelectDate) {
                                onSelectDate(dateStr);
                            }
                        }}
                        title={
                            !d || isPastDate 
                                ? "" 
                                : !dateHasAppointments 
                                ? "No appointments available for this date" 
                                : `Select ${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`
                        }
                    >
                        {d || ""}
                    </div>
                );
            })}
        </div>
        </div>

            {/*time slots here */}
        <div className="timeslot-panel">
            {selected ? (
                    <>
                        <p>Available Time Slots</p>
                        <Timeslots 
                            timeslots={(pageType === "home" || pageType === "hospital") && timeSlots.length > 0 
                                ? timeSlots 
                                : ((pageType === "home" || pageType === "hospital") && appointments.length > 0 
                                    ? appointments.flatMap(apt => {
                                        const slots = apt.time_slots || [];
                                        // Format date to YYYY-MM-DD to match selectedDate format
                                        let dateStr;
                                        if (apt.appointment_date) {
                                            if (typeof apt.appointment_date === 'string') {
                                                // Handle YYYY-MM-DD format or full datetime string
                                                dateStr = apt.appointment_date.split('T')[0].split(' ')[0];
                                            } else if (apt.appointment_date instanceof Date) {
                                                dateStr = apt.appointment_date.toISOString().split('T')[0];
                                            } else {
                                                dateStr = String(apt.appointment_date).split('T')[0].split(' ')[0];
                                            }
                                        }
                                        
                                        if (!dateStr || slots.length === 0) return [];
                                        
                                        return slots.map((slot, slotIndex) => {
                                            // Handle time slot format: could be object with start/end or string
                                            let timeDisplay = '';
                                            let timeKey = '';
                                            
                                            if (slot && typeof slot === 'object') {
                                                // Handle object format: {start: "09:00", end: "10:00", is_available: true}
                                                const startTime = slot.start || '';
                                                const endTime = slot.end || '';
                                                
                                                if (startTime && endTime) {
                                                    timeDisplay = `${startTime} - ${endTime}`;
                                                    timeKey = startTime;
                                                } else if (startTime) {
                                                    timeDisplay = startTime;
                                                    timeKey = startTime;
                                                }
                                            } else if (slot) {
                                                // Handle string format (fallback)
                                                timeDisplay = String(slot);
                                                timeKey = timeDisplay;
                                            }
                                            
                                            if (!timeDisplay) return null;
                                            
                                            return {
                                                id: `${apt.id}_${slotIndex}_${timeKey}`,
                                                date: dateStr,
                                                time: timeDisplay,
                                                time_key: timeKey,
                                                status: slot.is_available === false ? 'booked' : 'available',
                                                appointment_id: apt.id,
                                                start: typeof slot === 'object' ? (slot.start || timeKey) : timeKey,
                                                end: typeof slot === 'object' ? (slot.end || null) : null
                                            };
                                        }).filter(slot => slot !== null);
                                    }).filter(slot => slot && slot.date)
                                    : timeslots)} 
                            selectedDate = {selectedDate}
                            pageType = {pageType}
                            setStep = {setStep}
                            setTime = {setTime} 
                            hospitalAppt ={hospitalAppt}
                            thankMessHospital = {thankMessHospital}
                            setThankMessHospital = {setThankMessHospital}
                            hospital={hospital}
                        />

                    </>
            ) : (
                <p>Select Date First</p>
            )}
        </div>
    </div>
);
}