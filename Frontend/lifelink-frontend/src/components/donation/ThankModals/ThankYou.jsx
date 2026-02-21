import SuccessAnimation from "../../../animations/animationSuccess";
export default function ThankModal({ onClose }) {
  return (
    <div className="modal-overlay">
      <div className="modal-box">
      <SuccessAnimation />
        <h2>Thank you for your donation!</h2>
        <p>Your support helps us keep going ❤️</p>
        <button onClick={onClose}>Close</button>
      </div>
    </div>
  );
}
