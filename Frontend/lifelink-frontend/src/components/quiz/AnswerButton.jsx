import { FiCheck, FiX } from "react-icons/fi";
import "./AnswerButton.css";

export default function AnswerButton({ 
    option, 
    index, 
    isSelected, 
    isCorrect, 
    showResult,
    onClick,
    disabled 
}) {
    const getButtonClass = () => {
        if (!showResult) {
            return isSelected ? 'answer-button-selected' : 'answer-button';
        }
        
        if (isCorrect) {
            return 'answer-button-correct';
        }
        if (isSelected && !isCorrect) {
            return 'answer-button-incorrect';
        }
        return 'answer-button-disabled';
    };

    return (
        <button
            type="button"
            className={getButtonClass()}
            onClick={() => onClick(index)}
            disabled={disabled || showResult}
        >
            <span className="answer-button-text">{option}</span>
            {showResult && isSelected && (
                <span className="answer-button-icon">
                    {isCorrect ? <FiCheck /> : <FiX />}
                </span>
            )}
        </button>
    );
}

