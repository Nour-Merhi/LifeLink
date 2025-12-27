import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuiz } from "../../store/quizStore";
import { 
    FaTrophy, 
    FaMedal, 
    FaAward
} from "react-icons/fa";
import { 
    FiCheckCircle,
    FiXCircle,
    FiHome,
    FiRotateCcw
} from "react-icons/fi";
import { MdHealthAndSafety } from "react-icons/md";
import "./QuizResults.css";

export default function QuizResults() {
    const navigate = useNavigate();
    const { quizState, getScore, getBadge, resetQuiz } = useQuiz();

    useEffect(() => {
        if (!quizState.isCompleted) {
            navigate("/quiz");
        }
    }, [quizState.isCompleted, navigate]);

    const score = getScore();
    const badge = getBadge();

    const handleTryAgain = () => {
        resetQuiz();
        navigate(`/quiz/${quizState.category}/question`);
    };

    const handleBackHome = () => {
        resetQuiz();
        navigate("/quiz");
    };

    const getBadgeIcon = () => {
        switch (badge.type) {
            case 'gold':
                return <FaTrophy className="quiz-badge-icon quiz-badge-gold" />;
            case 'silver':
                return <FaMedal className="quiz-badge-icon quiz-badge-silver" />;
            case 'bronze':
                return <FaAward className="quiz-badge-icon quiz-badge-bronze" />;
            default:
                return <MdHealthAndSafety className="quiz-badge-icon quiz-badge-participant" />;
        }
    };

    const categoryNames = {
        'blood-donation': 'Blood Donation',
        'organ-donation': 'Organ Donation',
        'health-first-aid': 'Health & First Aid'
    };

    return (
        <div className="quiz-results-page">
            <div className="quiz-results-container">
                <div className="quiz-results-header">
                    <h1 className="quiz-results-title">Quiz Complete!</h1>
                    <p className="quiz-results-subtitle">
                        {categoryNames[quizState.category] || 'Quiz'} Challenge
                    </p>
                </div>

                <div className="quiz-results-content">
                    {/* Badge Section */}
                    <div className="quiz-badge-section">
                        {getBadgeIcon()}
                        <h2 className="quiz-badge-label">{badge.label}</h2>
                        <p className="quiz-badge-description">
                            You scored {score.percentage}% on this quiz!
                        </p>
                    </div>

                    {/* Score Summary */}
                    <div className="quiz-score-summary">
                        <div className="quiz-score-card quiz-score-correct">
                            <FiCheckCircle className="quiz-score-icon" />
                            <div className="quiz-score-info">
                                <span className="quiz-score-value">{score.correct}</span>
                                <span className="quiz-score-label">Correct Answers</span>
                            </div>
                        </div>
                        <div className="quiz-score-card quiz-score-wrong">
                            <FiXCircle className="quiz-score-icon" />
                            <div className="quiz-score-info">
                                <span className="quiz-score-value">{score.wrong}</span>
                                <span className="quiz-score-label">Wrong Answers</span>
                            </div>
                        </div>
                        <div className="quiz-score-card quiz-score-total">
                            <MdHealthAndSafety className="quiz-score-icon" />
                            <div className="quiz-score-info">
                                <span className="quiz-score-value">{score.total}</span>
                                <span className="quiz-score-label">Total Questions</span>
                            </div>
                        </div>
                    </div>

                    {/* Performance Message */}
                    <div className="quiz-performance-message">
                        {score.percentage >= 90 && (
                            <p className="quiz-performance-text">
                                🎉 Outstanding! You're a true LifeLink Hero! Your knowledge is exceptional.
                            </p>
                        )}
                        {score.percentage >= 70 && score.percentage < 90 && (
                            <p className="quiz-performance-text">
                                👍 Great job! You have solid knowledge. Keep learning to become a Hero!
                            </p>
                        )}
                        {score.percentage >= 50 && score.percentage < 70 && (
                            <p className="quiz-performance-text">
                                💪 Good effort! Review the topics and try again to improve your score.
                            </p>
                        )}
                        {score.percentage < 50 && (
                            <p className="quiz-performance-text">
                                📚 Keep learning! Review the material and try again. Every attempt makes you better.
                            </p>
                        )}
                    </div>

                    {/* Action Buttons */}
                    <div className="quiz-results-actions">
                        <button
                            type="button"
                            className="quiz-action-button quiz-action-primary"
                            onClick={handleTryAgain}
                        >
                            <FiRotateCcw />
                            Try Again
                        </button>
                        <button
                            type="button"
                            className="quiz-action-button quiz-action-secondary"
                            onClick={handleBackHome}
                        >
                            <FiHome />
                            Back to Home
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

