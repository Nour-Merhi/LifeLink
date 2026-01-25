import { useState } from "react";
import { IoAdd, IoRemove } from "react-icons/io5";
import { FaPlus } from "react-icons/fa6";
import QuestionSVG from "../../assets/illustrations/Question.svg";
import AnimatedSection from "../common/AnimatedSection";
import "./QuestionSection.css";

export default function QuestionSection() {
    const [openIndex, setOpenIndex] = useState(0);

    const faqs = [
        {
            question: "How do I donate blood from Home?",
            answer: "Go to donate page, select home blood donation. Then, you have the freedom to select the right time for you based on the available ones. After that, fill in the form, and your appointment is booked."
        },
        {
            question: "What are the eligibility requirements for blood donation?",
            answer: "To donate blood, you must be at least 18 years old, weigh at least 110 pounds, be in good general health, and not have donated blood in the last 56 days. You'll also need a valid ID and will go through a brief health screening."
        },
        {
            question: "How often can I donate blood?",
            answer: "You can donate whole blood every 56 days (8 weeks). This allows your body enough time to replenish the red blood cells lost during donation. Platelet donations can be made more frequently, up to 24 times per year."
        },
        {
            question: "Is blood donation safe?",
            answer: "Yes, blood donation is very safe. We use sterile, disposable equipment for each donation, so there's no risk of contracting any disease. The donation process takes about 10-15 minutes, and most people feel fine afterward."
        },
        {
            question: "What happens to my donated blood?",
            answer: "Your donated blood is tested, processed, and then distributed to hospitals and medical facilities where it's used to help patients undergoing surgery, receiving cancer treatment, experiencing trauma, or dealing with various medical conditions."
        }
    ];

    const toggleFAQ = (index) => {
        setOpenIndex(openIndex === index ? null : index);
    };

    return (
        <AnimatedSection className="question-section" animation="fade-up">
            <div className="question-section-background">
                <img src={QuestionSVG} alt="Question mark illustration" className="question-section-illustration" />
            </div>
            
            <div className="question-section-container">
                <div className="question-section-header">
                    <span className="question-section-label">FAQ</span>
                    <h2 className="question-section-title">Frequently Asked Questions</h2>
                    <p className="question-section-description">
                        Everything you need to know about blood and organ donation. Find quick answers to common questions below.
                    </p>
                </div>

                <div className="question-section-accordion">
                    {faqs.map((faq, index) => (
                        <div 
                            key={index} 
                            className={`question-accordion-item ${openIndex === index ? 'open' : ''}`}
                        >
                            <button
                                className="question-accordion-button"
                                onClick={() => toggleFAQ(index)}
                            >
                                <span className="question-accordion-question">{faq.question}</span>
                                <span className="question-accordion-icon">
                                    {openIndex === index ? (
                                        <IoRemove className="icon-remove" />
                                    ) : (
                                        <FaPlus className="icon-add" />
                                    )}
                                </span>
                            </button>
                            {openIndex === index && (
                                <div className="question-accordion-answer">
                                    <p>{faq.answer}</p>
                                </div>
                            )}
                        </div>
                    ))}
                </div> 
            </div>
        </AnimatedSection>
    );
}

