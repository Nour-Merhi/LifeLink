 import { IoCheckmarkSharp } from "react-icons/io5";
 
 export default function ThankModalHomeBlood({onClose}){ 
  return (
    <div className="modal-overlay">
      <div className="modal-box">
        <div className="complete">
          <div className="tick">
              <IoCheckmarkSharp />
          </div>
          <h3>Appointment Completed!</h3>
        </div>

        <div className="app-info">
            <div className="pb-3">
                <small>Hospital:</small>
                <small>Al Rasool Al Aazam Hospital</small>
            </div>
            <div className="pb-3">
                <small>Date:</small>
                <small>13 August 2025</small>
            </div>
            <div>
                <small>Time:</small>
                <small>10:00 AM</small>
            </div>
        </div>

        <div className="conf-mess">
          <small>A confirmation email has been sent to your registered email address. Please check.</small>
          <button className="modal-btn" onClick={onClose}>Back Home</button>
        </div>
      </div>
    </div>
  );
}