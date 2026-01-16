import {useState, useEffect} from "react";

export default function QuizTimer({questionIndex, onTimeUp, isSubmitted}) {
    const DURATION = 10; // seconds
    const [time, setTime] = useState(DURATION);
  
    useEffect(() => {
      // Reset timer when the question changes
      setTime(DURATION);
    }, [questionIndex]);
  
    useEffect(() => {
      // Stop timer if answer is submitted
      if (isSubmitted) {
        return;
      }

      if (time === 0) {
        onTimeUp?.(); // call callback if provided
        return;
      }
  
      const interval = setInterval(() => {
        setTime((t) => t - 1);
      }, 1000);
  
      return () => clearInterval(interval);
    }, [time, isSubmitted, onTimeUp]);
  
    // Percentage remaining for the bar
    const percent = (time / DURATION) * 100;
  

    return (
        <div className="quiz-timer">
          <div className="quiz-timer-circle">
            <span className="quiz-timer-number">{time.toString()}</span>
          </div>
        </div>
    )
}