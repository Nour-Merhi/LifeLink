import { useState, useEffect } from "react";
import { IoClose } from "react-icons/io5";
import { SpinnerDotted } from "spinners-react";
import api from "../../../api/axios";
import "../../../styles/Dashboard.css";

export default function EditQuizQuestionModal({ onClose, onSaved, question }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    question: "",
    options: ["", "", "", ""],
    correct_answer: "",
    points: 10,
  });

  useEffect(() => {
    if (!question) return;
    const opts = Array.isArray(question.options) ? question.options : [];
    const filled = [...opts];
    while (filled.length < 4) filled.push("");
    setForm({
      question: question.question || "",
      options: filled.slice(0, 4),
      correct_answer: question.correct_answer || "",
      points: question.points ?? 10,
    });
  }, [question]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleOptionChange = (index, value) => {
    setForm((prev) => {
      const next = [...prev.options];
      next[index] = value;
      return { ...prev, options: next };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    const trimmedQuestion = form.question.trim();
    const options = form.options.map((o) => o.trim()).filter(Boolean);
    const correct = form.correct_answer.trim();
    if (!trimmedQuestion) {
      setError("Question is required.");
      return;
    }
    if (options.length < 2) {
      setError("At least 2 options are required.");
      return;
    }
    if (!correct || !options.includes(correct)) {
      setError("Correct answer must be one of the options.");
      return;
    }

    setLoading(true);
    try {
      await api.get("/sanctum/csrf-cookie");
      await api.put(`/api/admin/dashboard/quiz/questions/${question.id}`, {
        question: trimmedQuestion,
        options,
        correct_answer: correct,
        points: form.points,
      });
      onSaved?.();
      onClose?.();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update question.");
    } finally {
      setLoading(false);
    }
  };

  if (!question) return null;

  const opts = form.options;
  const validOptions = opts.map((o) => o.trim()).filter(Boolean);

  return (
    <div className="modal" role="dialog" aria-modal="true" style={{ padding: "1rem" }}>
      <div className="modal-container" style={{ maxWidth: "560px", minWidth: "400px", maxHeight: "85vh" }}>
        <div className="modal-title">
          <h2>Edit Quiz Question</h2>
          <button type="button" onClick={onClose} disabled={loading} aria-label="Close">
            <IoClose />
          </button>
        </div>
        <div className="modal-form">
          {error && (
            <div className="error-message" style={{ marginBottom: "1rem" }}>
              {error}
            </div>
          )}
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Question *</label>
              <textarea
                name="question"
                value={form.question}
                onChange={handleChange}
                placeholder="Enter question text"
                rows={3}
                style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #d1d5db", resize: "vertical" }}
                required
              />
            </div>
            <div className="form-group">
              <label>Options (2–4) *</label>
              {[0, 1, 2, 3].map((i) => (
                <input
                  key={i}
                  type="text"
                  value={opts[i] || ""}
                  onChange={(e) => handleOptionChange(i, e.target.value)}
                  placeholder={`Option ${i + 1}`}
                  style={{ width: "100%", marginBottom: "8px", padding: "8px 12px", borderRadius: "8px", border: "1px solid #d1d5db" }}
                />
              ))}
            </div>
            <div className="form-group">
              <label>Correct answer *</label>
              <select
                name="correct_answer"
                value={form.correct_answer}
                onChange={handleChange}
                required
                style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #d1d5db" }}
              >
                <option value="">— Select correct option —</option>
                {validOptions.map((o) => (
                  <option key={o} value={o}>{o}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Points</label>
              <input
                type="number"
                name="points"
                value={form.points}
                onChange={handleChange}
                min={0}
                max={100}
                style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #d1d5db" }}
              />
            </div>
            <div className="form-submit-btn" style={{ display: "flex", gap: "12px", marginTop: "1.5rem", flexWrap: "wrap" }}>
              <button type="submit" className="add-btn" disabled={loading} style={{ margin: 0 }}>
                {loading ? <SpinnerDotted size={20} color="#fff" /> : "Save"}
              </button>
              <button type="button" onClick={onClose} disabled={loading} className="btn-cancel" style={{ margin: 0 }}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
