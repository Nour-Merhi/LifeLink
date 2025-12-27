import "./QuizProgress.css";

export default function QuizProgress({ current, total }) {
    const percentage = (current / total) * 100;

    return (
        <div className="quiz-progress">
            <div className="quiz-progress-header">
                <span className="quiz-progress-text">
                    Question {current} of {total}
                </span>
                <span className="quiz-progress-percentage">
                    {Math.round(percentage)}%
                </span>
            </div>
            <div className="quiz-progress-bar">
                <div 
                    className="quiz-progress-fill"
                    style={{ width: `${percentage}%` }}
                />
            </div>
        </div>
    );
}

