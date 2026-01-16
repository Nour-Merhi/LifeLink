import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";
import api from "../../../api/axios";
import QuizTimer from "./QuizTimer";
import ConfettieAnimation from "../../../animations/animationConfettie";

const QuestionCards = ({ currentLevel = 1 }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [index, setIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [answers, setAnswers] = useState({}); // Store answers for all questions: { questionIndex: selectedOptionIndex }
  const [submittedQuestions, setSubmittedQuestions] = useState({}); // Track which questions have been submitted
  const [showCelebration, setShowCelebration] = useState(false); // Show celebration animation
  const [isAnimationPlaying, setIsAnimationPlaying] = useState(false); // Track if animation is playing
  const [timer, setTimer] = useState(20);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const totalQuestions = 10;
  
  // Fetch questions from backend
  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await api.get(`/api/quiz/questions/${currentLevel}`);
        console.log('Questions fetched from API:', response.data);
        if (response.data && response.data.length > 0) {
          setQuestions(response.data);
        } else {
          console.warn('API returned empty questions array for level:', currentLevel);
          setError('No questions available for this level');
          setQuestions([]);
        }
      } catch (err) {
        console.error('Error fetching questions:', err);
        console.error('Error details:', err.response?.data || err.message);
        setError(`Failed to load questions: ${err.response?.data?.message || err.message}`);
        setQuestions([]);
      } finally {
        setLoading(false);
      }
    };

    if (currentLevel) {
      fetchQuestions();
    }
  }, [currentLevel]);
  
  
  // Use questions from backend only (no fallback to prevent showing wrong questions)
  const questionsToUse = questions;
  const currentQuestion = questionsToUse[index];
  const currentQuestionNumber = index + 1;

  // Restore answer and submission state when question index changes
  useEffect(() => {
    const savedAnswer = answers[index];
    const wasSubmitted = submittedQuestions[index] || false;
    
    setSelectedOption(savedAnswer !== undefined ? savedAnswer : null);
    setIsSubmitted(wasSubmitted);
  }, [index, answers, submittedQuestions]);

  const handleOptionClick = (optionIndex) => {
    if (!isSubmitted) {
      setSelectedOption(optionIndex);
      // Save answer for current question
      setAnswers(prev => ({ ...prev, [index]: optionIndex }));
    }
  };

  const getOptionState = (optionIndex) => {
    if (!isSubmitted) {
      // Before submission: show selected or unselected
      return selectedOption === optionIndex ? "selected" : "unselected";
    }
    
    // After submission: show correct/incorrect colors
    if (selectedOption === optionIndex) {
      return currentQuestion.options[optionIndex].isCorrect ? "correct" : "incorrect";
    }
    
    // Show other options as unselected even after submission
    return "unselected";
  };

  const handlePrevious = () => {
    if (index > 0) {
      setIndex(prev => prev - 1);
      // Answer and submission state will be restored by useEffect
    }
  };

  const handleSubmit = async () => {
    if (selectedOption !== null && !isSubmitted) {
      setIsSubmitted(true);
      // Save submission state for current question
      setSubmittedQuestions(prev => ({ ...prev, [index]: true }));
      // Ensure answer is saved
      setAnswers(prev => ({ ...prev, [index]: selectedOption }));
      
      // Submit answer to backend for XP calculation
      if (user && currentQuestion) {
        try {
          const selectedAnswer = currentQuestion.options[selectedOption].option;
          await api.post('/api/quiz/answer-question', {
            question_id: currentQuestion.id,
            answer: selectedAnswer,
            quiz_level: currentLevel
          });
        } catch (err) {
          console.error('Error submitting answer:', err);
          // Don't block UI if answer submission fails
        }
      }
    } else if (isSubmitted) {
      // Move to next question after showing the result
      if (index < questionsToUse.length - 1) {
        setIndex(prev => prev + 1);
      } else {
        // This is the Finish button - trigger celebration and navigate
        handleFinish();
      }
    }
  };

  const handleFinish = async () => {
    // Submit level completion to backend if authenticated
    if (user) {
      try {
        await api.post('/api/quiz/complete-level', {
          level_number: currentLevel
        });
      } catch (err) {
        console.error('Error completing level:', err);
      }
    }
    // Show celebration animation
    setShowCelebration(true);
    setIsAnimationPlaying(true);
    
    // After animation ends (3 seconds), navigate to summary
    setTimeout(() => {
      setIsAnimationPlaying(false);
      setShowCelebration(false);
      // Navigate to summary page with answers and questions data
      navigate("/quizlit/summary", {
        state: {
          answers: answers,
          questions: questionsToUse,
          currentLevel: currentLevel, // Pass current level to summary
        },
        replace: false
      });
    }, 3000);
  };

  const handleTimeUp = () => {
    // Auto-submit when time is up
    if (!isSubmitted) {
      setIsSubmitted(true);
      // Save submission state for current question
      setSubmittedQuestions(prev => ({ ...prev, [index]: true }));
      // Ensure answer is saved (even if null/undefined when time runs out)
      if (selectedOption !== null && selectedOption !== undefined) {
        setAnswers(prev => ({ ...prev, [index]: selectedOption }));
      }
    }
  };


  if (loading) {
    return (
      <div className="quiz-question-container">
        <div style={{ padding: '40px', textAlign: 'center', color: '#fff' }}>
          Loading questions...
        </div>
      </div>
    );
  }

  if (error || questionsToUse.length === 0) {
    return (
      <div className="quiz-question-container">
        <div style={{ padding: '40px', textAlign: 'center', color: '#fff' }}>
          {error || 'No questions available for this level'}
        </div>
      </div>
    );
  }

  return (
    <div className="quiz-question-container">
      {/* Celebration Animation */}
      {showCelebration && (
        <div className="celebration-animation">
          <ConfettieAnimation />
        </div>
      )}
      
      {/* Progress Indicator and Timer */}
      <div className="quiz-question-header">
        <div className="quiz-progress-indicator">
          {Array.from({ length: Math.min(totalQuestions, questionsToUse.length) }, (_, i) => {
            const questionIndex = i + 1;
            let state = "unfilled";
            if (questionIndex < currentQuestionNumber) {
              state = "completed";
            } else if (questionIndex === currentQuestionNumber) {
              state = "current";
            }
            return (
              <div
                key={i}
                className={`quiz-progress-circle ${state}`}
              />
            );
          })}
        </div>
        
      </div>

      {/* Question Card */}
      <div className="card-stack">
        {/* TIMER CARD */}
        <QuizTimer questionIndex={index} onTimeUp={handleTimeUp} isSubmitted={isSubmitted} />
        
        {/* NEXT CARD (underneath) */}
        {questions[index + 1] && (
          <motion.div
            className="card next"
            initial={{ scale: 0.95, y: 28, opacity: 0.7 }}
            animate={{ scale: 0.95, y: 28, opacity: 0.7 }}
          >
            {/* Next card preview content */}
          </motion.div>
        )}

        {/* CURRENT CARD */}
        <AnimatePresence mode="wait">
          <motion.div
            key={index}
            className="card top"
            initial={{ scale: 1, y: 0, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ y: -300, rotate: -6, opacity: 0 }}
            transition={{ duration: 0.7 }}
          >
            <div className="quiz-question-card-content">
              <h2 className="quiz-question-number">Question {currentQuestionNumber}:</h2>
              <p className="quiz-question-text">{currentQuestion.question}</p>
              
              <div className="quiz-options-container">
                {currentQuestion.options.map((option, optionIndex) => {
                  const state = getOptionState(optionIndex);
                  return (
                    <div
                      key={optionIndex}
                      className={`quiz-option-bar ${state}`}
                      onClick={() => handleOptionClick(optionIndex)}
                    >
                      <div className="quiz-option-content">
                        <span className="quiz-option-letter">{option.letter})</span>
                        <span className="quiz-option-text">{option.option}</span>
                      </div>
                      <div className={`quiz-option-radio ${state}`}>
                        {(state === "selected" || state === "correct" || state === "incorrect") && (
                          <div className={`quiz-radio-fill ${state}`}></div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Action Buttons */}
      <div className="quiz-action-buttons">
            <button
              className="quiz-previous-button"
              onClick={handlePrevious}
              disabled={index === 0}
            >
              Previous
            </button>
            <button
              className="quiz-submit-button"
              onClick={handleSubmit}
              disabled={(!submittedQuestions[index] && selectedOption === null) || isAnimationPlaying}
            >
              {submittedQuestions[index] ? (index < questionsToUse.length - 1 ? "Next" : "Finish") : "Submit"}
            </button>
      </div>

    </div>
  );
};

export default QuestionCards;