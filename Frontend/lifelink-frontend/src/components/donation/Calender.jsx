import { useState, useEffect, useRef } from "react";
import Timeslots from "./Timeslots";

export default function CalendarStep({ 
    onSelectDate, 
    pageType, 
    storagePrefix,
    thankMessHospital, 
    setThankMessHospital,
    setStep,
    setTime,
    hospitalAppt,
    hospital,
    appointments = [],
    timeSlots = [],
    availableSlots = 0
}) {
  // Get current date info
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();

  // days in month
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay(); // weekday of 1st
  const currentDay = new Date().getDate();

  // Check if this is an urgent appointment
  const isUrgent = hospital?.appointment_type === 'urgent';

  // For urgent appointments, auto-select today's date
  const getTodayDateString = () => {
    const pad = (n) => n.toString().padStart(2, "0");
    return `${year}-${pad(month + 1)}-${pad(currentDay)}`;
  };

  // Initialize state based on urgent status
  // For urgent appointments, always start with today selected
  const initialSelected = isUrgent ? currentDay : null;
  const initialSelectedDate = isUrgent ? getTodayDateString() : null;
  
  const [selected, setSelected] = useState(initialSelected);
  const [selectedDate, setSelectedDate] = useState(initialSelectedDate);
  
  // Use a ref to track if we've already auto-selected for urgent appointments
  const urgentDateInitialized = useRef(false);

  // Helper function to normalize dates
  const normalizeDate = (dateStr) => {
    if (!dateStr) return '';
    if (typeof dateStr === 'string') {
      return dateStr.split('T')[0].split(' ')[0];
    }
    return dateStr.toString().split('T')[0].split(' ')[0];
  };

  // Get all dates that have appointments for this hospital
  const getAvailableDates = () => {
    // Prioritize timeSlots if available (has booking status), otherwise use appointments
    if ((pageType === "home" || pageType === "hospital") && timeSlots && timeSlots.length > 0) {
      const dateSet = new Set();
      timeSlots.forEach(slot => {
        if (slot.date) {
          const dateStr = normalizeDate(slot.date);
          if (dateStr) {
            dateSet.add(dateStr);
          }
        }
      });
      return dateSet;
    }
    
    if ((pageType !== "home" && pageType !== "hospital") || !appointments || appointments.length === 0) {
      return new Set();
    }
    
    // Extract unique dates from appointments (fallback)
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
    
    // For urgent appointments, only today is allowed
    // For urgent, always allow today even if appointments haven't loaded yet
    if (isUrgent) {
      if (day !== currentDay) return false;
      // If appointments are loaded, check if today has appointments
      if (appointments && appointments.length > 0) {
        const pad = (n) => n.toString().padStart(2, "0");
        const dateStr = `${year}-${pad(month + 1)}-${pad(day)}`;
        return availableDates.has(dateStr);
      }
      // If appointments haven't loaded yet, still allow today for urgent
      return true;
    }
    
    const pad = (n) => n.toString().padStart(2, "0");
    const dateStr = `${year}-${pad(month + 1)}-${pad(day)}`;
    return availableDates.has(dateStr);
  };

  // Auto-select today when urgent hospital is selected (only once per hospital)
  useEffect(() => {
    if ((pageType === "home" || pageType === "hospital") && isUrgent && hospital?.id) {
      // Only initialize once per hospital
      if (urgentDateInitialized.current !== hospital.id) {
        const todayStr = getTodayDateString();
        
        // Set the date
        setSelected(currentDay);
        setSelectedDate(todayStr);
        if (onSelectDate) {
          onSelectDate(todayStr);
        }
        
        // Mark as initialized for this hospital
        urgentDateInitialized.current = hospital.id;
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isUrgent, hospital?.id]);

  // Reset selection when appointments change (for regular appointments)
  useEffect(() => {
    if (pageType === "home" || pageType === "hospital") {
      // Skip if urgent - handled by previous useEffect
      if (isUrgent) return;
      
      // For regular appointments, check if there's a date in localStorage
      const prefix = storagePrefix || (pageType === "home" ? "home_" : "hospital_");
      const storedDate = localStorage.getItem(prefix + "date");
      if (storedDate) {
        try {
          // Avoid timezone shifts when parsing YYYY-MM-DD / ISO strings
          const storedDateStr = normalizeDate(storedDate);
          const [storedYear, storedMonth1, storedDay] = storedDateStr.split('-').map(Number);
          const storedMonth = (storedMonth1 || 0) - 1;
          
          // Check if stored date is in current month and has appointments
          if (storedMonth === month && storedYear === year) {
            if (availableDates.has(storedDateStr) && hasAppointments(storedDay)) {
              setSelected(storedDay);
              setSelectedDate(storedDateStr);
            } else {
              setSelected(null);
              setSelectedDate(null);
            }
          } else {
            setSelected(null);
            setSelectedDate(null);
          }
        } catch (e) {
          setSelected(null);
          setSelectedDate(null);
        }
      } else {
        setSelected(null);
        setSelectedDate(null);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appointments, pageType, isUrgent]);

  const days = [];
  for (let i = 0; i < firstDay; i++) days.push(null); // empty slots
  for (let d = 1; d <= daysInMonth; d++) days.push(d);
   
return (
    <div className="calendar-container">
            <div className="calendar-step">
                    <div className="select-date">
                            <h2 className="font-semibold text-xl">
                                {isUrgent ? "Urgent Appointment - Today Only" : "Select Date"}
                            </h2>
                            {!isUrgent && (
                                <h2 className="font-light">{today.toLocaleString("default", { month: "long" })} {year}</h2>
                            )}
                            {isUrgent && (
                                <h2 className="font-light">
                                    {today.toLocaleString("default", { 
                                        weekday: "long", 
                                        month: "long", 
                                        day: "numeric", 
                                        year: "numeric" 
                                    })}
                                </h2>
                            )}
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
                
                // For urgent appointments, disable all dates except today
                const isDisabledForUrgent = isUrgent && d !== currentDay;
                
                return (
                    <div id="dates"
                        key={i}
                        className={`p-2 m-1 text-center rounded ${
                            !d
                                ? ""
                                : isPastDate || isDisabledForUrgent
                                ? "text-gray-400 cursor-not-allowed opacity-40"
                                : !dateHasAppointments && d >= currentDay
                                ? "text-gray-500 cursor-not-allowed opacity-50 muted-date"
                                : isSelected
                                ? "bg-gradient-to-r from-red-500 to-red-800 font-bold text-white cursor-pointer"
                                : isToday && dateHasAppointments
                                ? "border-2 border-red-500 cursor-pointer hover:bg-red-50"
                                : dateHasAppointments
                                ? "cursor-pointer hover:bg-red-50 border border-gray-200"
                                : ""
                        }`}
                        style={{
                            background:
                                d && !isSelected && d >= currentDay && dateHasAppointments && !isDisabledForUrgent
                                    ? "transparent"
                                    : undefined
                        }}
                        onClick={() => {
                            if (!d || d < currentDay || !dateHasAppointments || isDisabledForUrgent) return;
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
                                : isDisabledForUrgent
                                ? "Urgent appointments can only be scheduled for today"
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
            {selected && selectedDate ? (
                    <>
                        <p>Available Time Slots</p>
                        
                        <Timeslots 
                            timeslots={(pageType === "home" || pageType === "hospital") && Array.isArray(timeSlots) && timeSlots.length > 0
                                ? timeSlots.filter(slot => {
                                    // Filter slots for the selected date
                                    if (!slot.date || !selectedDate) return false;
                                    const slotDate = normalizeDate(slot.date);
                                    const selectedDateNormalized = normalizeDate(selectedDate);
                                    return slotDate === selectedDateNormalized;
                                })
                                : (appointments.length > 0 
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
                                        
                                        // Debug logging for urgent appointments
                                        if (isUrgent) {
                                          console.log('Calendar - Processing appointment:', {
                                            appointmentId: apt.id,
                                            appointmentDate: apt.appointment_date,
                                            dateStr,
                                            selectedDate,
                                            match: dateStr === selectedDate,
                                            slotsCount: slots.length,
                                            rawSlots: slots
                                          });
                                        }
                                        
                                        // Only include slots for the selected date
                                        // For urgent appointments, be more lenient with date matching
                                        const dateMatches = dateStr && selectedDate && dateStr === selectedDate;
                                        
                                        if (!dateMatches || slots.length === 0) {
                                          if (isUrgent) {
                                            console.log('Calendar - Filtering out appointment (date mismatch or no slots):', {
                                              dateStr,
                                              selectedDate,
                                              slotsCount: slots.length,
                                              matches: dateMatches
                                            });
                                          }
                                          return [];
                                        }
                                        
                                        if (isUrgent) {
                                          console.log('Calendar - Including appointment slots:', {
                                            appointmentId: apt.id,
                                            slotsCount: slots.length
                                          });
                                        }
                                        
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
                                            
                                            const slotObj = {
                                                id: `${apt.id}_${slotIndex}_${timeKey}`,
                                                date: dateStr,
                                                time: timeDisplay,
                                                time_key: timeKey,
                                                status: slot.is_available === false ? 'booked' : 'available',
                                                appointment_id: apt.id,
                                                start: typeof slot === 'object' ? (slot.start || timeKey) : timeKey,
                                                end: typeof slot === 'object' ? (slot.end || null) : null
                                            };
                                            
                                            if (isUrgent && slotIndex < 3) { // Log first 3 slots for debugging
                                              console.log('Calendar - Created slot object:', slotObj);
                                            }
                                            
                                            return slotObj;
                                        }).filter(slot => slot !== null);
                                    }).filter(slot => slot && slot.date)
                                    : []
                                )}
                            selectedDate={selectedDate}
                            pageType={pageType}
                            storagePrefix={storagePrefix}
                            setStep={setStep}
                            setTime={setTime} 
                            hospitalAppt={hospitalAppt}
                            thankMessHospital={thankMessHospital}
                            setThankMessHospital={setThankMessHospital}
                            hospital={hospital}
                            isUrgent={isUrgent}
                        />

                    </>
            ) : (
                <p>Select Date First {isUrgent && !selectedDate && '(Auto-selecting today...)'}</p>
            )}
        </div>
    </div>
);
}