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

  const filterSlots = (timeslots || []).filter(
    (slot) => slot.date === selectedDate?.toString()
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
                  setSelectedTime(slot.time);
                  setSelectedSlot(slot.id);
                }}
              >
                <div
                  className={`times ${
                    slot.status === "booked"
                      ? "bg-gray-200 text-gray-400 opacity-50"
                      : selectedSlot === slot.id
                      ? "bg-red-600 text-white"
                      : "bg-gray-200"
                  }`}
                >
                  <h3>{slot.time}</h3>
                  <span>{slot.status === "booked" ? "Booked" : "Available"}</span>
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
            console.log("clickeddd")
            if(pageType === "home"){
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
