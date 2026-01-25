import { useState, useEffect } from "react";
import { MdQuiz } from "react-icons/md";
import { FiPlus } from "react-icons/fi";
import { SpinnerDotted } from "spinners-react";
import api from "../../api/axios";
import QuizQuestionTable from "./quizManagementComponents/QuizQuestionTable";
import "../../styles/Dashboard.css";

export default function QuizManagement() {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [levelFilter, setLevelFilter] = useState("");
  const [generateLevel, setGenerateLevel] = useState(1);
  const [generating, setGenerating] = useState(false);
  const [generateError, setGenerateError] = useState("");

  const fetchQuestions = () => {
    setLoading(true);
    setError("");
    api
      .get("/api/admin/dashboard/quiz/questions")
      .then((res) => {
        setQuestions(res.data.questions || []);
      })
      .catch((err) => {
        setError(err.response?.data?.message || "Failed to fetch quiz questions");
        setQuestions([]);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchQuestions();
  }, []);

  const handleGenerate = () => {
    setGenerating(true);
    setGenerateError("");
    api
      .get("/sanctum/csrf-cookie")
      .then(() =>
        api.post("/api/admin/dashboard/quiz/generate-questions", {
          level: generateLevel,
        })
      )
      .then(() => {
        setGenerateError("");
        fetchQuestions();
      })
      .catch((err) => {
        setGenerateError(err.response?.data?.message || "Failed to generate questions");
      })
      .finally(() => setGenerating(false));
  };

  return (
    <section className="financial-section">
      <div className="dashboard-title">
        <div>
          <div className="icon-title">
            <MdQuiz className="icon-size" />
            <h2>Quiz Management</h2>
          </div>
          <p>Generate and edit quiz questions by level</p>
        </div>
        <div className="add-btn" style={{ flexDirection: "column", alignItems: "flex-end", gap: "8px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <label style={{ fontSize: "14px", fontWeight: 500 }}>Level</label>
            <select
              value={generateLevel}
              onChange={(e) => setGenerateLevel(Number(e.target.value))}
              disabled={generating}
              style={{ padding: "8px 12px", borderRadius: "8px", border: "1px solid #d1d5db", minWidth: "80px" }}
            >
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((l) => (
                <option key={l} value={l}>{l}</option>
              ))}
            </select>
            <button
              type="button"
              onClick={handleGenerate}
              disabled={generating}
              style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
            >
              {generating ? (
                <SpinnerDotted size={18} color="#fff" />
              ) : (
                <FiPlus />
              )}
              {generating ? "Generating…" : "Generate Questions"}
            </button>
          </div>
          {generateError && (
            <div className="error-message" style={{ fontSize: "13px" }}>
              {generateError}
            </div>
          )}
        </div>
      </div>

      <QuizQuestionTable
        questions={questions}
        loading={loading}
        error={error}
        levelFilter={levelFilter}
        onLevelFilterChange={setLevelFilter}
        onQuestionsUpdate={fetchQuestions}
      />
    </section>
  );
}
