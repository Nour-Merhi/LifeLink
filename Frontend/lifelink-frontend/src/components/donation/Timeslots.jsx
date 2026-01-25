import { useEffect, useState, useMemo } from "react";
import React from "react";
import { useNavigate } from "react-router-dom";
import ThankModalHospital from "../donation/ThankModals/ThankModalHospitalBlood.jsx";

export default function Timeslots({
   timeslots, 
   selectedDate, 
   pageType, 
   storagePrefix,
   thankMessHospital, 
   setThankMessHospital, 
   setStep, 
   setTime,
   hospitalAppt,
   hospital,
   isUrgent = false
  }) 
  {
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [selectedTime, setSelectedTime] = useState("");

  const navigate = useNavigate();

  // Ensure we always work with an array (sometimes callers accidentally pass JSX or an object)
  const slotsArray = useMemo(() => {
    if (Array.isArray(timeslots)) return timeslots;
    if (!timeslots) return [];
    // Guard against React elements being passed by mistake
    if (React.isValidElement(timeslots)) return [];
    // Some backends may return an object map instead of an array
    if (typeof timeslots === "object") {
      try {
        const values = Object.values(timeslots);
        return Array.isArray(values) ? values.filter(Boolean) : [];
      } catch {
        return [];
      }
    }
    return [];
  }, [timeslots]);

  // Check if this is an urgent appointment (from prop or hospital object)
  const urgentAppointment = isUrgent || 
                            hospital?.appointment_type === 'urgent' ||
                            hospitalAppt?.hospital?.appointment_type === 'urgent' || 
                            (typeof hospitalAppt === 'object' && hospitalAppt?.appointment_type === 'urgent');

  useEffect(() => {
    setSelectedSlot(null);
    setSelectedTime("");
  }, [selectedDate]);

  // Normalize date strings for comparison (handle different formats)
  const normalizeDate = (dateStr) => {
    if (!dateStr) return '';
    // If it's already in YYYY-MM-DD format, return as is
    if (typeof dateStr === 'string') {
      // Remove time portion if present
      return dateStr.split('T')[0].split(' ')[0];
    }
    return dateStr.toString().split('T')[0].split(' ')[0];
  };

  const normalizedSelectedDate = normalizeDate(selectedDate);

  // Helper function to get full datetime for a slot
  const getSlotDateTime = (slot, dateStr) => {
    try {
      // Get the start time from the slot
      let startTime = '';
      if (slot.start) {
        startTime = slot.start;
      } else if (slot.time) {
        // Extract time from "09:00 - 10:00" format
        startTime = slot.time.split(' - ')[0].trim();
      } else if (typeof slot === 'string') {
        startTime = slot.split(' - ')[0].trim();
      }

      if (!startTime || !dateStr) return null;

      // Parse the time (format: "HH:MM" or "H:MM")
      const [hours, minutes] = startTime.split(':').map(Number);
      if (isNaN(hours) || isNaN(minutes)) return null;

      // Create datetime object
      const [year, month, day] = dateStr.split('-').map(Number);
      const slotDateTime = new Date(year, month - 1, day, hours, minutes, 0);

      return slotDateTime;
    } catch (error) {
      console.error('Error parsing slot datetime:', error);
      return null;
    }
  };

  // Filter slots by date and for urgent appointments, filter by time (within 24 hours)
  // Use useMemo to prevent infinite loops and avoid recalculating on every render
  const filterSlots = useMemo(() => {
    if (!slotsArray || slotsArray.length === 0 || !selectedDate || !normalizedSelectedDate) {
      return [];
    }
    
    const now = new Date();
    
    return slotsArray.filter(
    (slot) => {
        if (!slot || !slot.date) return false;
        
      const slotDate = normalizeDate(slot.date);
        
        // Check date match - this is the critical filter
        if (slotDate !== normalizedSelectedDate) {
          return false;
        }

        // Filter out past time slots - check if the slot time has already passed
        const slotDateTime = getSlotDateTime(slot, normalizedSelectedDate);
        if (slotDateTime && slotDateTime <= now) {
          // Slot is in the past, exclude it
          return false;
        }

        // For urgent appointments, show all slots that match today's date and are in the future
        // The backend should already filter urgent appointments to only show today
        if (urgentAppointment) {
          return true;
      }

      return true;
    }
  );
  }, [slotsArray, selectedDate, normalizedSelectedDate, urgentAppointment]);
  
  // Debug logging (only log when values actually change to avoid infinite loops)
  useEffect(() => {
    if (urgentAppointment && selectedDate) {
      const filteredCount = filterSlots.length;
      console.log('Timeslots component state:', {
        selectedDate,
        normalizedSelectedDate,
        urgentAppointment,
        timeslotsLength: slotsArray?.length || 0,
        filterSlotsLength: filteredCount,
        hospitalAppointmentType: hospital?.appointment_type,
        isUrgent,
        firstSlotDate: slotsArray?.[0]?.date,
        dateMatchIssue: slotsArray?.[0]?.date && normalizeDate(slotsArray[0].date) !== normalizedSelectedDate
      });
      
      // Log sample of slots to check date formats (only if there's a mismatch and debugging is needed)
      // Removed to reduce console noise - date filtering is handled in filterSlots useMemo
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate, urgentAppointment, slotsArray?.length, hospital?.appointment_type]);

  const onClose = () => {
    setThankMessHospital(false)
    setStep("hospitals")
  }

  return (
    <>
      <div className="dates-available">
        {!selectedDate ? (
          <p className="pt-2 text-gray-500">Please select a date first.</p>
        ) : filterSlots.length === 0 ? (
          <p className="pt-2 text-red-500">
            {urgentAppointment 
              ? "No time slots available within the next 24 hours for today." 
              : "No time slots available for this date."}
          </p>
        ) : (
          filterSlots.map((slot) => (
            <div key={slot.id}>
              <button
                className="time-slot-btn"
                disabled={slot.status === "booked"}
                onClick={() => {
                  if (slot.status !== "booked") {
                    setSelectedTime(slot.time);
                    setSelectedSlot(slot.id);
                  }
                }}
                style={{
                  cursor: slot.status === "booked" ? "not-allowed" : "pointer",
                  opacity: slot.status === "booked" ? 0.5 : 1
                }}
              >
                <div
                  className={`times ${
                    slot.status === "booked"
                      ? "bg-gray-300 text-gray-500 opacity-60 booked-slot"
                      : selectedSlot === slot.id
                      ? "bg-red-600 text-white"
                      : "bg-[#e9e9e9] hover:bg-gray-300"
                  }`}
                >
                  <h3>{slot.time}</h3>
                  <span>
                    {slot.status === "booked" 
                      ? slot.max_capacity && slot.bookings_count 
                        ? `Booked (${slot.bookings_count}/${slot.max_capacity})` 
                        : "Booked"
                      : "Available"}
                  </span>
                </div>
              </button>
            </div>
          ))
        )}
      </div>

      {selectedSlot && (
        <button
          type="button"
          className="confirm-time-btn"
          onClick={() => {
            // Store time in localStorage (scoped when possible)
            const prefix = storagePrefix || (pageType === "home" ? "home_" : "hospital_");
            const timeKey = prefix + "appointment_time";
            if(pageType === "home"){
              localStorage.setItem(timeKey, selectedTime);
              console.log("→ navigating to home form");
              navigate("/donation/home-blood-form")
            }else if(pageType === "hospital"){
              localStorage.setItem(timeKey, selectedTime);
              console.log("→ navigating to hospital form");
              navigate("/donation/hospital-blood-form")
            }
          }}
        >
          Confirm Time to Proceed
        </button>
      )}

      {(pageType === "hospital" && thankMessHospital) &&
        <ThankModalHospital hospitalAppt= {hospitalAppt} onClose={ onClose } />
      }
    </>
  );
}
