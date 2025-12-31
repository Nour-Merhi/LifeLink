import swordIcon from "../../assets/imgs/swordIcon.svg";
import xpIcon from "../../assets/imgs/xpIcon.svg";
import leadrboardIcon from "../../assets/imgs/leadrboardIcon.svg";
import "../../styles/quizzlit.css";
import ArrowAnimation from "../../animations/animationArrow";
import gameWave from "../../assets/imgs/wave/gameWave.svg";

export default function QuizSteps() {
    return (
        <div className="quiz-steps-section">
            {/* Header Section */}
            <div className="quiz-steps-header">
                <div className="flex flex-col gap-2">
                    <p className="quiz-steps-subtitle">Engage</p>
                    <h2 className="quiz-steps-title">Know These Three Steps</h2>
                    <p className="quiz-steps-subtitle-main">& Be One of Our Top Players!</p>
                </div>
                <div className="w-[150px] h-[100px] mt-auto mb-[-20px]">
                    <ArrowAnimation />
                </div>
            </div>

            {/* Steps Cards */}
            <div className="quiz-steps-container">
                <img src={gameWave} alt="Game Wave" className="quiz-steps-wave" />
                {/* Step 01: Play & Learn */}
                <div className="quiz-step-card quiz-step-card-01">
                    <div className="quiz-step-pin-1"></div>
                    <div className="quiz-step-pin-2"></div>
                    
                    <div className="quiz-step-content">
                        <img src={swordIcon} alt="Sword Icon" className="quiz-step-icon" width="120px" height="120px" />

                        <div className="quiz-step-number"><span>0</span>1</div>
                        <h3 className="quiz-step-card-title">Play & Learn</h3>
                        <p className="quiz-step-card-description">
                            Answer simple questions about blood donation and health. Each question helps clear myths and builds real awareness that can save lives.
                        </p> 
                    </div>
                </div>

                {/* Step 02: Earn Experience */}
                <div className="quiz-step-card quiz-step-card-02">
                    <div className="quiz-step-pin-1"></div>
                    <div className="quiz-step-pin-2"></div>
                    <div className="quiz-step-content">
                        <img src={xpIcon} alt="XP Icon" className="quiz-step-icon" width="110px" height="110px" />

                        <div className="quiz-step-number"><span>0</span>2</div>
                        <h3 className="quiz-step-card-title">Earn Experience</h3>
                        <p className="quiz-step-card-description">
                            Every correct answer earns you XP. The more you play, the more you grow your knowledge and unlock your role as a LifeLink supporter.
                        </p>
                    </div>
                </div>

                {/* Step 03: Challenge & Inspire */}
                <div className="quiz-step-card quiz-step-card-03">
                    <div className="quiz-step-pin-1"></div>
                    <div className="quiz-step-pin-2"></div>
                    
                    <div className="quiz-step-content ">
                        <img src={leadrboardIcon} alt="Leaderboard Icon" className="quiz-step-icon !mt-[-90px]" width="130px" height="130px" />
                        <div className="quiz-step-number"><span>0</span>3</div>
                        <h3 className="quiz-step-card-title">Challenge & Inspire</h3>
                        <p className="quiz-step-card-description">
                            Compete on the leaderboard and inspire others to learn. Awareness spreads faster when we learn together.
                        </p>
                    </div>
                </div>

            </div>
        </div>
    );
}
