import { useState } from "react";
import { FiEdit } from "react-icons/fi";
import { IoSearchSharp } from "react-icons/io5";
import { SpinnerDotted } from "spinners-react";
import api from "../../../api/axios";
import EditQuizQuestionModal from "./EditQuizQuestionModal";
import "../../../styles/Dashboard.css";

export default function QuizQuestionTable({
  questions = [],
  loading = false,
  error = "",
  levelFilter = "",
  onLevelFilterChange,
  onQuestionsUpdate,
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [editingQuestion, setEditingQuestion] = useState(null);

  const filtered = questions.filter((q) => {
    const matchLevel = !levelFilter || String(q.level) === String(levelFilter);
    const search = searchTerm.trim().toLowerCase();
    const matchSearch =
      !search ||
      (q.question || "").toLowerCase().includes(search) ||
      (q.correct_answer || "").toLowerCase().includes(search) ||
      (Array.isArray(q.options) && q.options.some((o) => String(o).toLowerCase().includes(search)));
    return matchLevel && matchSearch;
  });

  const handleEdit = (q) => {
    setEditingQuestion(q);
  };

  const handleEditClose = () => {
    setEditingQuestion(null);
  };

  const handleEditSaved = () => {
    onQuestionsUpdate?.();
    handleEditClose();
  };

  const optionsPreview = (opts) => {
    if (!Array.isArray(opts)) return "—";
    const s = opts.slice(0, 4).join(" · ");
    return s.length > 60 ? s.slice(0, 60) + "…" : s || "—";
  };

  return (
    <section className="hospital-table-section">
      <div className="control-panel control-panel-layout">
        <div className="search-input">
          <IoSearchSharp />
          <input
            type="search"
            placeholder="Search by question or options…"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="filter-gap" style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <label style={{ fontSize: "14px", fontWeight: 500 }}>Level</label>
          <select
            value={levelFilter}
            onChange={(e) => onLevelFilterChange?.(e.target.value)}
            style={{ padding: "8px 12px", borderRadius: "8px", border: "1px solid #d1d5db", minWidth: "100px" }}
          >
            <option value="">All</option>
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((l) => (
              <option key={l} value={l}>{l}</option>
            ))}
          </select>
        </div>
      </div>

      {error && (
        <div className="error-message" style={{ marginBottom: "1rem" }}>
          {error}
        </div>
      )}
      {loading ? (
        <div className="flex items-center justify-center" style={{ minHeight: "200px" }}>
          <SpinnerDotted size={48} color="#F12C31" />
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ padding: "2rem", textAlign: "center", color: "#6b7280" }}>
          No quiz questions found. Generate questions for a level first.
        </div>
      ) : (
        <div className="table-design">
          <table className="h1-table">
            <thead>
              <tr>
                <th className="text-left col-level" style={{ width: "80px" }}>Level</th>
                <th className="text-left col-question">Question</th>
                <th className="col-options">Options</th>
                <th className="col-correct">Correct</th>
                <th className="col-points" style={{ width: "80px" }}>Points</th>
                <th className="col-actions" style={{ width: "100px" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((q) => (
                <tr key={q.id}>
                  <td className="col-level">
                    <strong>{q.level}</strong>
                  </td>
                  <td className="col-question" style={{ maxWidth: "320px" }}>
                    <span title={q.question}>{(q.question || "").slice(0, 80)}{(q.question || "").length > 80 ? "…" : ""}</span>
                  </td>
                  <td className="col-options" style={{ maxWidth: "280px", fontSize: "13px" }}>
                    {optionsPreview(q.options)}
                  </td>
                  <td className="col-correct" style={{ maxWidth: "160px" }}>
                    {(q.correct_answer || "").slice(0, 40)}{(q.correct_answer || "").length > 40 ? "…" : ""}
                  </td>
                  <td className="col-points">{q.points ?? "—"}</td>
                  <td className="col-actions">
                    <button
                      type="button"
                      className="icon-btn"
                      title="Edit"
                      onClick={() => handleEdit(q)}
                    >
                      <FiEdit /> Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {editingQuestion && (
        <EditQuizQuestionModal
          question={editingQuestion}
          onClose={handleEditClose}
          onSaved={handleEditSaved}
        />
      )}
    </section>
  );
}
