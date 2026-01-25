import SuccessAnimation from "../../../animations/animationSuccess";
 
 export default function ThankModalHomeBlood({onClose}){ 
  return (
    <div className="modal-overlay">
      <div className="modal-box">
        <div className="complete">
         <SuccessAnimation />
          <h3>Appointment Completed!</h3>
        </div>

        <div className="thank-mess">
          <h2>Thank You for Your Support</h2>
          <small>Now you can save 3 lives together in one shot!</small>
        </div>

        <div className="conf-mess">
          <small>A confirmation email has been sent to your registered email address. Please check.</small>
          <button className="modal-btn" onClick={onClose}>Back Home</button>
        </div>
      </div>
    </div>
  );
}