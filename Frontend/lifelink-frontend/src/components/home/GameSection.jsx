import { useNavigate } from "react-router-dom";
import { IoArrowForward } from "react-icons/io5";

import GameAnimation from "../../assets/illustrations/GameAnimation_1.svg";
import BackgroundWave from "../../assets/imgs/wave/Background_game_wave.svg";
import "./GameSection.css";

export default function GameSection() {
    const navigate = useNavigate();

    const handleStart = () => {
        navigate("/quizlit");
    };

    const handleLearnMore = () => {
        // Navigate to learn more page or scroll to more info
        console.log("Learn more clicked");
    };
    const handleAskQuestion = () => {
        // Navigate to contact page or open a form
        console.log("Ask question clicked");
    };

    return (
        <section className="game-section">
            <div className="question-section-action">
                    <button className="question-ask-button" onClick={handleAskQuestion}>
                        Ask Question
                        <IoArrowForward className="question-ask-icon" />
                    </button>
                </div>
            <div className="game-section-wave">
                <img src={BackgroundWave} alt="Background wave" className="game-wave-svg" />
            </div>

            <div className="game-section-container">
                <div className="game-section-content">
                    <div className="game-section-left">
                        <span className="game-section-label">Engage</span>
                        <div className="max-w-[450px]">
                        <h2 className="game-section-title">Join the Fun and Earn Your Badges!</h2>
                            <p className="game-section-description">
                                Dive into our exciting quizzes that challenge your knowledge and spark your curiosity. Compete with others and climb the leaderboard while making a difference.
                            </p>
                        </div>

                        <div className="game-section-features">
                            <div className="game-feature-item">
                                <h3 className="game-feature-title">Challenge Yourself</h3>
                                <p className="game-feature-description">
                                    Test your knowledge and earn rewards for your participation in our quizzes.
                                </p>
                            </div>
                            <div className="game-feature-item">
                                <h3 className="game-feature-title">Leaderboard Awaits</h3>
                                <p className="game-feature-description">
                                    See how you rank against other donors and quiz enthusiasts.
                                </p>
                            </div>
                        </div>

                        <div className="game-section-actions">
                            <button className="game-start-button" onClick={handleStart}>
                                Start
                            </button>
                            <button className="game-learn-more-button" onClick={handleLearnMore}>
                                Learn More
                                <IoArrowForward className="game-learn-icon" />
                            </button>
                        </div>
                    </div>

                    <div className="game-section-right">
                        <div className="game-illustration-container">
                            <img 
                                src={GameAnimation} 
                                alt="Gaming illustration" 
                                className="game-illustration"
                            />
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}

