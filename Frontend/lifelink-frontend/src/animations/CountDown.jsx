import { DotLottieReact } from "@lottiefiles/dotlottie-react";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";

export default function CountDown({ open, onClose }) {
    const navigate = useNavigate();

  useEffect(() => {
    if (!open) return;

    const timer = setTimeout(() => {
      navigate("/quizlit/game-interface");
    }, 3000);

    return () => clearTimeout(timer);
  }, [open, navigate]);

  if (!open) return null;

  return (
    <section className="quizzlit-section">
      <div className="circle-container">
          <div className="circle-red animate-soft-pulse"></div>
          <div className="circle-purple animate-soft-pulse"></div>
          <div className="circle-red circle-bottom-right animate-soft-pulse"></div>
          <div className="circle-purple circle-bottom-right animate-soft-pulse"></div>
      </div>
      <DotLottieReact
        src="/animation/Countdown Animation.lottie"
        autoplay
        loop={false}
      />
  </section>
  );
}
