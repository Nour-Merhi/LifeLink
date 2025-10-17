 import { IoCheckmarkSharp } from "react-icons/io5";
 
 export default function ThankModalAfterDeath({onClose}){ 
  return (
    <div className="modal-overlay">
      <div className="modal-box">
        <div className="complete">
          <div className="tick">
              <IoCheckmarkSharp />
          </div>
          <h3>Registration Completed!</h3>
        </div>

        <div className="thank-mess">
          <h2>Thank You for Your Support</h2>
          <small>Your registration is a big support for us!</small>
        </div>

        <div className="conf-mess">
          <small>A confirmation email has been sent to your registered email address. Please check.</small>
          <button className="modal-btn" onClick={onClose}>Back Home</button>
        </div>
      </div>
    </div>
  );
}