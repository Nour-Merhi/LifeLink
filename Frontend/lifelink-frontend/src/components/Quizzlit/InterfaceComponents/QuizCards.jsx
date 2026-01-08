import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";

const QuestionCards = () => {
  const [index, setIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [timer, setTimer] = useState(20);
  const totalQuestions = 10;
  
  const questions = [
    { 
      question: "Which blood type is considered the universal donor?",
      options: [
        { option: "Blood type A+", isCorrect: false, letter: "A" },
        { option: "Blood type B+", isCorrect: false, letter: "B" },
        { option: "Blood type AB+", isCorrect: false, letter: "C" },
        { option: "Blood type O-", isCorrect: true, letter: "D" },
      ],
      answer: "Blood type O-",
    },
    { 
      question: "What is the capital of France?",
      options: [
        { option: "Paris", isCorrect: true, letter: "A" },
        { option: "Berlin", isCorrect: false, letter: "B" },
        { option: "Rome", isCorrect: false, letter: "C" },
        { option: "Madrid", isCorrect: false, letter: "D" },
      ],
      answer: "Paris",
    },
    { 
      question: "What is the capital of Germany?",
      options: [
        { option: "Berlin", isCorrect: true, letter: "A" },
        { option: "Paris", isCorrect: false, letter: "B" },
        { option: "Rome", isCorrect: false, letter: "C" },
        { option: "Madrid", isCorrect: false, letter: "D" },
      ],
      answer: "Berlin",
    },
    { 
      question: "What is the capital of Italy?",
      options: [
        { option: "Rome", isCorrect: true, letter: "A" },
        { option: "Paris", isCorrect: false, letter: "B" },
        { option: "Berlin", isCorrect: false, letter: "C" },
        { option: "Madrid", isCorrect: false, letter: "D" },
      ],
      answer: "Rome",
    },
    { 
      question: "What is the capital of Spain?",
      options: [
        { option: "Madrid", isCorrect: true, letter: "A" },
        { option: "Paris", isCorrect: false, letter: "B" },
        { option: "Berlin", isCorrect: false, letter: "C" },
        { option: "Rome", isCorrect: false, letter: "D" },
      ],
      answer: "Madrid",
    },
    { 
      question: "What is the capital of Portugal?",
      options: [
        { option: "Lisbon", isCorrect: true, letter: "A" },
        { option: "Paris", isCorrect: false, letter: "B" },
        { option: "Berlin", isCorrect: false, letter: "C" },
        { option: "Rome", isCorrect: false, letter: "D" },
      ],
      answer: "Lisbon",
    },
    { 
      question: "What is the capital of Greece?",
      options: [
        { option: "Athens", isCorrect: true, letter: "A" },
        { option: "Paris", isCorrect: false, letter: "B" },
        { option: "Berlin", isCorrect: false, letter: "C" },
        { option: "Rome", isCorrect: false, letter: "D" },
      ],
      answer: "Athens",
    },
    { 
      question: "What is the capital of Turkey?",
      options: [
        { option: "Ankara", isCorrect: true, letter: "A" },
        { option: "Paris", isCorrect: false, letter: "B" },
        { option: "Berlin", isCorrect: false, letter: "C" },
        { option: "Rome", isCorrect: false, letter: "D" },
      ],
      answer: "Ankara",
    },
    { 
      question: "What is the capital of Russia?",
      options: [
        { option: "Moscow", isCorrect: true, letter: "A" },
        { option: "Paris", isCorrect: false, letter: "B" },
        { option: "Berlin", isCorrect: false, letter: "C" },
        { option: "Rome", isCorrect: false, letter: "D" },
      ],
      answer: "Moscow",
    },
    { 
      question: "What is the capital of Japan?",
      options: [
        { option: "Tokyo", isCorrect: true, letter: "A" },
        { option: "Osaka", isCorrect: false, letter: "B" },
        { option: "Kyoto", isCorrect: false, letter: "C" },
        { option: "Yokohama", isCorrect: false, letter: "D" },
      ],
      answer: "Tokyo",
    },
  ];

  const currentQuestion = questions[index];
  const currentQuestionNumber = index + 1;

  const handleOptionClick = (optionIndex) => {
    if (!isSubmitted) {
      setSelectedOption(optionIndex);
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
      setSelectedOption(null);
      setIsSubmitted(false);
    }
  };

  const handleSubmit = () => {
    if (selectedOption !== null && !isSubmitted) {
      setIsSubmitted(true);
    } else if (isSubmitted) {
      // Move to next question after showing the result
      if (index < questions.length - 1) {
        setIndex(prev => prev + 1);
        setSelectedOption(null);
        setIsSubmitted(false);
      } else {
        // Handle quiz completion
        console.log("Quiz completed!");
      }
    }
  };

  return (
    <div className="quiz-question-container">
      {/* Progress Indicator and Timer */}
      <div className="quiz-question-header">
        <div className="quiz-progress-indicator">
          {Array.from({ length: totalQuestions }, (_, i) => {
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
        <div className="quiz-timer">
          <div className="quiz-timer-circle">
            <span className="quiz-timer-number">{timer}</span>
          </div>
        </div>
      </div>

      {/* Question Card */}
      <div className="card-stack">
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
            transition={{ duration: 0.4 }}
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
                  disabled={selectedOption === null}
                >
                  {isSubmitted ? (index < questions.length - 1 ? "Next" : "Finish") : "Submit"}
                </button>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

export default QuestionCards;