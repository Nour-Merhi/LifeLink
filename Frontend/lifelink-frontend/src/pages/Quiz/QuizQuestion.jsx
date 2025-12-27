import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuiz } from "../../store/quizStore";
import QuizProgress from "../../components/quiz/QuizProgress";
import QuizTimer from "../../components/quiz/QuizTimer";
import AnswerButton from "../../components/quiz/AnswerButton";
import { FiArrowRight } from "react-icons/fi";
import "./QuizQuestion.css";

export default function QuizQuestion() {
    const { category } = useParams();
    const navigate = useNavigate();
    const {
        quizState,
        startQuiz,
        selectAnswer,
        nextQuestion,
        getCurrentQuestion
    } = useQuiz();

    const [selectedAnswerIndex, setSelectedAnswerIndex] = useState(null);
    const [showResult, setShowResult] = useState(false);
    const [timerExpired, setTimerExpired] = useState(false);

    useEffect(() => {
        if (!quizState.category || quizState.category !== category) {
            startQuiz(category);
        }
    }, [category, startQuiz, quizState.category]);

    useEffect(() => {
        setSelectedAnswerIndex(null);
        setShowResult(false);
        setTimerExpired(false);
    }, [quizState.currentQuestionIndex]);

    const currentQuestion = getCurrentQuestion();

    if (!currentQuestion) {
        if (quizState.isCompleted) {
            navigate(`/quiz/results`);
            return null;
        }
        return <div className="quiz-loading">Loading question...</div>;
    }

    const handleAnswerSelect = (answerIndex) => {
        if (showResult) return;
        
        setSelectedAnswerIndex(answerIndex);
        selectAnswer(answerIndex);
        setShowResult(true);
    };

    const handleTimeUp = () => {
        if (!showResult) {
            setTimerExpired(true);
            // Auto-select wrong answer (index -1 means time expired)
            selectAnswer(-1);
            setShowResult(true);
            setSelectedAnswerIndex(-1);
        }
    };

    const handleNext = () => {
        if (quizState.currentQuestionIndex < quizState.questions.length - 1) {
            nextQuestion();
        } else {
            navigate(`/quiz/results`);
        }
    };

    const isCorrect = selectedAnswerIndex !== null && selectedAnswerIndex !== -1 && selectedAnswerIndex === currentQuestion.correctAnswer;
    const canProceed = showResult && (selectedAnswerIndex !== null || timerExpired);

    return (
        <div className="quiz-question-page">
            <div className="quiz-question-container">
                <QuizProgress
                    current={quizState.currentQuestionIndex + 1}
                    total={quizState.questions.length}
                />

                <div className="quiz-question-header">
                    <QuizTimer
                        initialSeconds={30}
                        onTimeUp={handleTimeUp}
                        isActive={!showResult}
                    />
                </div>

                <div className="quiz-question-content">
                    <h2 className="quiz-question-text">
                        {currentQuestion.question}
                    </h2>

                    {timerExpired && (
                        <div className="quiz-time-up-message">
                            ⏱️ Time's up! Moving to next question...
                        </div>
                    )}

                    <div className="quiz-answers">
                        {currentQuestion.options.map((option, index) => (
                            <AnswerButton
                                key={index}
                                option={option}
                                index={index}
                                isSelected={selectedAnswerIndex === index}
                                isCorrect={index === currentQuestion.correctAnswer}
                                showResult={showResult}
                                onClick={handleAnswerSelect}
                                disabled={showResult}
                            />
                        ))}
                    </div>

                    {showResult && (
                        <div className={`quiz-feedback ${isCorrect ? 'quiz-feedback-correct' : 'quiz-feedback-incorrect'}`}>
                            <p className="quiz-feedback-text">
                                {isCorrect 
                                    ? "✓ Correct! Well done!" 
                                    : `✗ Incorrect. The correct answer is: ${currentQuestion.options[currentQuestion.correctAnswer]}`
                                }
                            </p>
                            <p className="quiz-feedback-explanation">
                                {currentQuestion.explanation}
                            </p>
                        </div>
                    )}

                    {canProceed && (
                        <button
                            type="button"
                            className="quiz-next-button"
                            onClick={handleNext}
                        >
                            {quizState.currentQuestionIndex < quizState.questions.length - 1 
                                ? "Next Question" 
                                : "View Results"
                            }
                            <FiArrowRight />
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

