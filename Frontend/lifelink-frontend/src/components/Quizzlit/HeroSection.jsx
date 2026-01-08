import { useNavigate } from "react-router-dom";
import { IoArrowForward } from "react-icons/io5";
import gaming_animation from "../../assets/illustrations/gaming-animate.svg";
import "../../styles/quizzlit.css";

export default function HeroSection() {
    const navigate = useNavigate();

    const handleStart = () => {
        navigate("/quizlit/ready");
    };

    const handleLeaderboard = () => {
        // Navigate to leaderboard page when implemented
        // navigate("/leaderboard");
    };

    return (
        <> 
        <div className="quiz-hero-container">
            <div className="quiz-hero-content">
                {/* Left Section - Text Content */}
                <div className="quiz-hero-text">
                    <p className="quiz-hero-subtitle">Engage</p>
                    <div>
                        <h1 className="quiz-hero-title">LifeLink Challenge</h1>
                        <p className="quiz-hero-description">
                            Test your knowledge about blood donation, organ donation, and health safety
                        </p>
                    </div>
                    <div className="quiz-hero-actions">
                        <button className="quiz-start-button" onClick={handleStart}>
                            Start
                        </button>
                        <button className="quiz-leaderboard-link" onClick={handleLeaderboard}>
                            Jump to Leaderboard
                            <IoArrowForward className="quiz-arrow-icon" />
                        </button>
                    </div>
                </div>

                {/* Right Section - Illustration */}
                <div className="quiz-hero-illustration">
                    <div className="quiz-illustration-container">
                            <div>
                                <img src={gaming_animation} alt="gaming_animation" />
                            </div>
                    </div>
                </div>
            </div>
        </div>
        </>
    );
}

