import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import ThankModalHospital from "../donation/ThankModals/ThankModalHospitalBlood.jsx";

export default function Timeslots({
   timeslots, 
   selectedDate, 
   pageType, 
   thankMessHospital, 
   setThankMessHospital, 
   setStep, 
   setTime,
   hospitalAppt
  }) 
  {
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [selectedTime, setSelectedTime] = useState("");

  const navigate = useNavigate();

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

  const filterSlots = (timeslots || []).filter(
    (slot) => {
      const slotDate = normalizeDate(slot.date);
      return slotDate === normalizedSelectedDate;
    }
  );

  const onClose = () => {
    setThankMessHospital(false)
    setStep("hospitals")
  }

  return (
    <>
      <div className="dates-available">
        {filterSlots.length === 0 ? (
          <p className="pt-2 text-red-500">No time slots available for this date.</p>
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
                      : "bg-gray-200 hover:bg-gray-300"
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
            // Store time in localStorage for home bookings
            if(pageType === "home"){
              localStorage.setItem("appointment_time", selectedTime);
              console.log("→ navigating to home form");
              navigate("/donation/home-blood-from")
            }else if(pageType === "hospital"){
              console.log("→ navigating to hospital ");
              setTime(selectedTime)
              setThankMessHospital(true)
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
