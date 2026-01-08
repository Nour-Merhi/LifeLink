import { useState } from "react"
import CountDown from "../animations/CountDown";
import "../styles/quizzlit.css";

export default function QuizReady() {
    const [openCountDown, setOpenCountDown] = useState(false);

    const onCLose = () => {
        setOpenCountDown(false);
    };
    const open = () => {
        setOpenCountDown(true);
    }

    const rules = [
        {
            number: 1,
            title: "Answer with Care",
            description: "The quiz is about saving lives. Read each question carefully and answer honestly."
        },
        {
            number: 2,
            title: "One Try, One Journey",
            description: "Once the quiz starts, don't refresh or exit the page. Progress will be lost if you do."
        },
        {
            number: 3,
            title: "Respect the Mission",
            description: "LifeLink represents people and real lives. Play responsible and respectfully."
        }
    ];

    if (openCountDown) {
        return <CountDown open={openCountDown} onClose={onCLose} />;
    }

    return (
        <div className="quiz-ready-page quizzlit-section">
            <div className="circle-container">
                <div className="circle-red animate-soft-pulse"></div>
                <div className="circle-purple animate-soft-pulse"></div>
                <div className="circle-red circle-bottom-right animate-soft-pulse"></div>
                <div className="circle-purple circle-bottom-right animate-soft-pulse"></div>
            </div>
            <div className="quiz-ready-container">
                {/* Top Section */}
                <div className="quiz-ready-header">
                    <div>
                        <h1 className="quiz-ready-title">Are You Ready?</h1>
                        <p className="quiz-ready-subtitle">
                            Brace yourself, prepare you information and let's go
                        </p>
                    </div>
                    <button 
                        className="quiz-ready-button"
                        onClick={open}
                    >
                        Let's Go!
                    </button>
                </div>

                {/* Rules Cards Section */}
                <div className="quiz-ready-rules">
                    {rules.map((rule) => (
                        <div key={rule.number} className="quiz-ready-rule-card">
                            <div className="rule-card-shadow"></div>
                            <div className="rule-card-content">

                                <div className="rule-card-outer-circle">
                                    <div className="rule-card-circle">
                                        <span className="rule-card-number">Rule {rule.number}</span>
                                    </div>
                                </div>
                                <h3 className="rule-card-title">{rule.title}</h3>
                                <p className="rule-card-description">{rule.description}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

