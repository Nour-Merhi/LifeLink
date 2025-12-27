import { useState, useEffect } from "react";
import { FiClock } from "react-icons/fi";
import "./QuizTimer.css";

export default function QuizTimer({ 
    initialSeconds = 30, 
    onTimeUp,
    isActive = true 
}) {
    const [timeLeft, setTimeLeft] = useState(initialSeconds);

    useEffect(() => {
        if (!isActive) return;

        if (timeLeft <= 0) {
            onTimeUp?.();
            return;
        }

        const timer = setTimeout(() => {
            setTimeLeft(timeLeft - 1);
        }, 1000);

        return () => clearTimeout(timer);
    }, [timeLeft, isActive, onTimeUp]);

    useEffect(() => {
        setTimeLeft(initialSeconds);
    }, [initialSeconds]);

    const percentage = (timeLeft / initialSeconds) * 100;
    const isLowTime = timeLeft <= 10;

    return (
        <div className={`quiz-timer ${isLowTime ? 'quiz-timer-low' : ''}`}>
            <div className="quiz-timer-icon">
                <FiClock />
            </div>
            <div className="quiz-timer-content">
                <div className="quiz-timer-bar">
                    <div 
                        className="quiz-timer-fill"
                        style={{ width: `${percentage}%` }}
                    />
                </div>
                <span className="quiz-timer-text">{timeLeft}s</span>
            </div>
        </div>
    );
}

