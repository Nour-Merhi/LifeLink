import { useEffect } from "react";
import { useQuiz } from "../../store/quizStore";
import { FaTint, FaHeartbeat } from "react-icons/fa";
import { MdHealthAndSafety as MdHealth } from "react-icons/md";
import QuizCard from "../../components/quiz/QuizCard";
import lifelink_logo from "../../assets/imgs/lifelink_logo.svg";
import "./QuizHome.css";

export default function QuizHome() {
    const { resetQuiz } = useQuiz();

    useEffect(() => {
        resetQuiz();
    }, [resetQuiz]);

    const categories = [
        {
            category: "blood-donation",
            icon: <FaTint className="quiz-category-icon" />,
            title: "Blood Donation",
            description: "Test your knowledge about blood donation, eligibility, and the donation process."
        },
        {
            category: "organ-donation",
            icon: <FaHeartbeat className="quiz-category-icon" />,
            title: "Organ Donation",
            description: "Learn about organ donation, transplantation, and how you can save lives."
        },
        {
            category: "health-first-aid",
            icon: <MdHealth className="quiz-category-icon" />,
            title: "Health & First Aid",
            description: "Master essential first aid skills and health knowledge for emergencies."
        }
    ];

    return (
        <div className="quiz-home">
            <div className="quiz-hero">
                <div className="quiz-hero-content">
                    <img src={lifelink_logo} alt="LifeLink Logo" className="quiz-logo" />
                    <h1 className="quiz-hero-title">LifeLink Quiz Challenge</h1>
                    <p className="quiz-hero-description">
                        Test your knowledge and become a certified LifeLink Awareness Hero.
                    </p>
                </div>
            </div>

            <div className="quiz-categories">
                <h2 className="quiz-categories-title">Choose Your Challenge</h2>
                <div className="quiz-cards-grid">
                    {categories.map((cat) => (
                        <QuizCard
                            key={cat.category}
                            category={cat.category}
                            icon={cat.icon}
                            title={cat.title}
                            description={cat.description}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
}

