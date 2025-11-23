 import { IoCheckmarkSharp } from "react-icons/io5";
 import axios from "axios";
 
 export default function ThankModalHomeBlood({hospitalAppt, onClose}){ 
  
  function submitAppointment() {
    axios.post('http://localhost:8000/api/hospital/appointments', hospitalAppt)
      .then(response => {
        console.log('Appointment saved:', response.data);
        setThankMessHospital(true); // show thank you modal on success
      })
      .catch(error => {
        console.error('Error saving appointment:', error);
        // optionally show error message to user here
      });
  }

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
                <small>{ hospitalAppt.hospital_name }</small>
            </div>
            <div className="pb-3">
                <small>Date:</small>
                <small>{ hospitalAppt.appointment_date }</small>
            </div>
            <div>
                <small>Time:</small>
                <small>{ hospitalAppt.appointment_time }</small>
            </div>
        </div>

        <div className="conf-mess">
          <small>A confirmation email has been sent to your registered email address. Please check.</small>
          <button className="modal-btn" onClick={() => {
            onClose()
            submitAppointment()
          }}>Back Home</button>
        </div>
      </div>
    </div>
  );
}