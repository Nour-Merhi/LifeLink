import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { FaHome } from "react-icons/fa";
import api from "../../api/axios";
import "../../styles/quizzlit.css";
import Leaderboard from "./quizSummaryComponents/Leaderboard";
import Summary from "./quizSummaryComponents/Summary";
import ProfileGameAnimation from "../../animations/profileGameAnimation";
import profileImage from "../../assets/imgs/profile.svg";

export default function QuizSummary() {
  const location = useLocation();
  const navigate = useNavigate();
  const { answers = {}, questions = [], currentLevel = 1 } = location.state || {};
  const [activeTab, setActiveTab] = useState("leaderboard");
  const [leaderboardData, setLeaderboardData] = useState([]);
  const [leaderboardLoading, setLeaderboardLoading] = useState(true);
  const [leaderboardError, setLeaderboardError] = useState(null);
  
  // Calculate next level (max 10 levels)
  const nextLevel = Math.min(currentLevel + 1, 10);
  const hasNextLevel = currentLevel < 10;

  // Calculate score
  const calculateScore = () => {
    let correctCount = 0;
    questions.forEach((question, index) => {
      const userAnswer = answers[index];
      if (userAnswer !== undefined && question.options[userAnswer]?.isCorrect) {
        correctCount++;
      }
    });
    return correctCount;
  };

  const score = calculateScore();
  const totalQuestions = questions.length;
  const wrongCount = totalQuestions - score;
  const pointsEarned = score * 10; // 10 points per correct answer

  const getAnswerStatus = (questionIndex) => {
    const userAnswer = answers[questionIndex];
    if (userAnswer === undefined) return "unanswered";
    
    const selectedOption = questions[questionIndex]?.options[userAnswer];
    return selectedOption?.isCorrect ? "correct" : "incorrect";
  };

  const getCorrectAnswerIndex = (questionIndex) => {
    return questions[questionIndex]?.options.findIndex(opt => opt.isCorrect) ?? -1;
  };

  // Fetch leaderboard data from backend
  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        setLeaderboardLoading(true);
        setLeaderboardError(null);
        const response = await api.get('/api/quiz/leaderboard', {
          params: { limit: 10 } // Get top 10 players
        });
        setLeaderboardData(response.data);
      } catch (err) {
        console.error('Error fetching leaderboard:', err);
        setLeaderboardError('Failed to load leaderboard');
        // Set empty array on error
        setLeaderboardData([]);
      } finally {
        setLeaderboardLoading(false);
      }
    };

    fetchLeaderboard();
  }, []);

  return (
    <div className="quiz-summary-container quizzlit-section">
      <div className="circle-container">
        <div className="circle-red animate-soft-pulse"></div>
        <div className="circle-purple animate-soft-pulse"></div>
        <div className="circle-red circle-bottom-right animate-soft-pulse"></div>
        <div className="circle-purple circle-bottom-right animate-soft-pulse"></div>
      </div>

      <div className="quiz-summary-wrapper">
        {/* Header */}
        <div className="quiz-summary-header">
          <h1 className="quiz-summary-title">Quiz Summery</h1>
          <button 
            className="quiz-summary-home-button"
            onClick={() => navigate("/quizlit/welcome")}
            aria-label="Home"
          >
            <FaHome className="quiz-summary-home-button-icon"/>
          </button>
        </div>

        {/* Congratulations Card */}
        <div className="quiz-summary-congratulations-card">
            <div className="quiz-summary-profile-game">
              <div className="quiz-summary-profile">
                <img src={profileImage} alt="Profile" />
              </div>
              <div className="quiz-summary-profile-game-animation">
                <ProfileGameAnimation />
              </div>
            </div>
            <h2 className="congratulations-title animate-bounce">Congratulations!</h2>
            <p className="congratulations-score">
              You've scored <span className="score-highlight">+{pointsEarned}</span> points
            </p>
            <div className="quiz-breakdown">
              <div className="breakdown-item">
                <span className="breakdown-number">{totalQuestions}</span>
                <span className="breakdown-label">Total Que</span>
              </div>
              <div className="breakdown-item">
                <span className="breakdown-number">{score}</span>
                <span className="breakdown-label">Correct</span>
              </div>
              <div className="breakdown-item">
                <span className="breakdown-number">{wrongCount}</span>
                <span className="breakdown-label">Wrong</span>
              </div>
            </div>
        </div>

        {/* Main Content Card with Tabs */}
        <div className="quiz-summary-main-card">
          {/* Tabs */}
          <div className="quiz-summary-tabs">
            <button
              className={`quiz-summary-tab ${activeTab === "leaderboard" ? "active" : ""}`}
              onClick={() => setActiveTab("leaderboard")}
            >
              Leaderboard
            </button>
            <button
              className={`quiz-summary-tab ${activeTab === "summary" ? "active" : ""}`}
              onClick={() => setActiveTab("summary")}
            >
              Summary
            </button>
            <button
              className={`quiz-summary-tab ${activeTab === "next-level" ? "active" : ""}`}
              onClick={() => {
                if (hasNextLevel) {
                  // Navigate directly to game interface with next level
                  navigate("/quizlit/game-interface", {
                    state: { startLevel: nextLevel }
                  });
                }
              }}
              disabled={!hasNextLevel}
            >
              Next Level
            </button>
          </div>

          {/* Tab Content */}
          <div className="quiz-summary-tab-content">
            {activeTab === "leaderboard" && (
              <Leaderboard
                leaderboardData={leaderboardData}
              />
            )}

            {activeTab === "summary" && (
              <Summary
                questions={questions}
                answers={answers}
                getAnswerStatus={getAnswerStatus}
              />
            )}

          </div>
        </div>
      </div>
    </div>
  );
}
