import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { IoArrowForward } from "react-icons/io5";
import gaming_animation from "../../assets/illustrations/gaming-animate.svg";
import "../../styles/quizzlit.css";

export default function HeroSection({ handleTopPlayersClick }) {
    const navigate = useNavigate();
    const { user, loading } = useAuth();

    const handleStart = () => {
        // Wait for auth to load
        if (loading) {
            return;
        }

        // Redirect to login if not authenticated
        if (!user) {
            navigate("/login", { 
                state: { 
                    from: "/quizlit/ready",
                    message: "Please log in as a donor to play the quiz"
                } 
            });
            return;
        }

        // Check if user is a donor
        if (user.role?.toLowerCase() !== "donor") {
            navigate("/quizlit/welcome", { 
                state: { 
                    message: "Quiz game is only available for donors. Please log in with a donor account."
                } 
            });
            return;
        }

        // Check if user has a donor profile
        if (!user.donor) {
            navigate("/quizlit/welcome", { 
                state: { 
                    message: "Please complete your donor profile to play the quiz."
                } 
            });
            return;
        }

        // All checks passed, navigate to quiz ready page
        navigate("/quizlit/ready");
    };

    const handleLeaderboard = () => {
        handleTopPlayersClick();
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

