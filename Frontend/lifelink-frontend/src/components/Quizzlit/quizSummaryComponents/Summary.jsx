export default function Summary({ questions, answers, getAnswerStatus }) {
    return (
        <div className="summary-tab-content pt-10 ">
            {questions.map((question, questionIndex) => {
                const status = getAnswerStatus(questionIndex);
                const userAnswerIndex = answers[questionIndex];

                return (
                <div key={questionIndex} className={`card summary-question-card ${status}`}>
                    <div className="quiz-question-card-content">
                        <div className="summary-question-header">
                            <h2 className="quiz-question-number">Question {questionIndex + 1}:</h2>
                            <span className={`summary-status-badge ${status}`}>
                            {status === "correct" && "✓ Correct"}
                            {status === "incorrect" && "✗ Incorrect"}
                            {status === "unanswered" && "○ Unanswered"}
                            </span>
                        </div>
                        <p className="quiz-question-text">{question.question}</p>
                        
                        <div className="quiz-options-container">
                            {question.options.map((option, optionIndex) => {
                            const isUserAnswer = userAnswerIndex === optionIndex;
                            const isCorrectAnswer = option.isCorrect;
                            
                            let state = "unselected";
                            if (isCorrectAnswer) state = "correct";
                            if (isUserAnswer && !isCorrectAnswer) state = "incorrect";
                            if (isUserAnswer && isCorrectAnswer) state = "correct";

                            return (
                                <div
                                key={optionIndex}
                                className={`quiz-option-bar ${state}`}
                                >
                                <div className="quiz-option-content">
                                    <span className="quiz-option-letter">{option.letter})</span>
                                    <span className="quiz-option-text">{option.option}</span>
                                </div>
                                <div className={`quiz-option-radio ${state}`}>
                                    {(state === "correct" || state === "incorrect") && (
                                    <div className={`quiz-radio-fill ${state}`}></div>
                                    )}
                                </div>
                                </div>
                            );
                            })}
                        </div>
                    </div>
                </div>
                );
            })}
        </div>
    )
}