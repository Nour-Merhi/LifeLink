import { useNavigate } from "react-router-dom";
import "./QuizCard.css";

export default function QuizCard({ category, icon, title, description }) {
    const navigate = useNavigate();

    const handleStartQuiz = () => {
        navigate(`/quiz/${category}/question`);
    };

    return (
        <div className="quiz-card">
            <div className="quiz-card-icon">
                {icon}
            </div>
            <div className="quiz-card-content">
                <h3 className="quiz-card-title">{title}</h3>
                <p className="quiz-card-description">{description}</p>
            </div>
            <button 
                type="button" 
                className="quiz-card-button"
                onClick={handleStartQuiz}
            >
                Start Quiz
            </button>
        </div>
    );
}

