import { FaTrophy } from "react-icons/fa";
import { FaHeartbeat } from "react-icons/fa";
import { FaBook, FaLightbulb } from "react-icons/fa";
import standiumIcon from "../../assets/imgs/standiumIcon.svg";
import pulseIcon from "../../assets/imgs/plusIcon.svg";
import bookIcon from "../../assets/imgs/bookIcon.svg";
import "../../styles/quizzlit.css";

export default function AboutSection() {
    return (
        <div className="about-section">
            <div className="about-section-header"> 
                <h2 className="about-section-title">
                    WhyChoose Us Our Elite Quiz
                </h2>
                <div className="about-section-underline">
                    <svg viewBox="5 0 105 10" className="w-full h-10">
                        <path
                            d="M0 9 Q50 0 100 9"
                            fill="none"
                            stroke="#E92C30"
                            strokeWidth="2"
                            strokeLinecap="round"
                        />
                    </svg>
                </div>
            </div>

            <div className="about-cards-container">
                {/* Leaderboards Card */}
                <div className="about-card">
                    <div className="about-icon-container">
                       <img src={standiumIcon} alt="Leaderboards" className="about-icon" />
                    </div>
                    <h3 className="about-card-title">Leaderboards</h3>
                    <p className="about-card-description">
                        Check out our Leaderboard to discover the top scorers in various quizzes. Join the competition and climb the ranks
                    </p>
                </div>

                {/* Impact Card */}
                <div className="about-card">
                    <div className="about-icon-container">
                        <img src={pulseIcon} alt="Impact" className="about-icon" />
                    </div>
                    <h3 className="about-card-title">Impact</h3>
                    <p className="about-card-description">
                        You become part of a community that cares! Learning together encourages more people to take life-saving steps
                    </p>
                </div>

                {/* Learn With Purpose Card */}
                <div className="about-card">
                    <div className="about-icon-container">
                        <img src={bookIcon} alt="Impact" className="about-icon" />
                    </div>
                    <h3 className="about-card-title">Learn With Purpose</h3>
                    <p className="about-card-description">
                        Our quiz is about understanding real facts that can save lives! Every question is designed to raise awareness
                    </p>
                </div>
            </div>
        </div>
    );
}
