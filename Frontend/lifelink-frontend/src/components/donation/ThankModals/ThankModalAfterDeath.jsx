import SuccessAnimation from "../../../animations/animationSuccess";

export default function ThankModalAfterDeath({ onClose }) {
  return (
    <div className="modal-overlay" role="dialog" aria-labelledby="thank-modal-title" aria-modal="true">
      <div className="modal-box">
        <div className="complete">
         <SuccessAnimation />
          <h3 id="thank-modal-title">Registration Completed!</h3>
        </div>

        <div className="thank-mess">
          <h2>Thank You for Your Generosity</h2>
          <small>Your after-death organ pledge registration is a tremendous support. One donor can save up to 8 lives.</small>
        </div>

        <div className="conf-mess">
          <small>A thank-you email has been sent to your registered email address. Please check your inbox.</small>
          <button className="modal-btn" onClick={onClose}>
            Back Home
          </button>
        </div>
      </div>
    </div>
  );
}