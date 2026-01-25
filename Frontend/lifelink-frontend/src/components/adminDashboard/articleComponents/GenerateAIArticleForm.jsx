import { useState } from "react";
import { IoClose } from "react-icons/io5";
import { SpinnerDotted } from "spinners-react";
import api from "../../../api/axios";

export default function GenerateAIArticleForm({ onClose, onAIGenerated }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const [form, setForm] = useState({
    category: "blood",
  });

  const [articleJson, setArticleJson] = useState(null);
  const [createdArticle, setCreatedArticle] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess(false);
    setArticleJson(null);
    setCreatedArticle(null);

    try {
      await api.get("/sanctum/csrf-cookie");

      const res = await api.post("/api/admin/dashboard/ai-articles", {
        category: form.category,
      });

      const json = res?.data?.article_json || null;
      const article = res?.data?.article || null;

      setArticleJson(json);
      setCreatedArticle(article);
      setSuccess(true);

      if (typeof onAIGenerated === "function") {
        onAIGenerated(article);
      }
    } catch (err) {
      console.error("❌ Error generating AI article:", err);
      if (err.response?.data?.errors) {
        const errorMessages = Object.values(err.response.data.errors).flat();
        setError(errorMessages.join(", "));
      } else {
        setError(err.response?.data?.message || "Failed to generate AI article. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="modal">
      <div className="modal-container">
        <div className="modal-title">
          <h2>Generate AI Article</h2>
          <button onClick={onClose} disabled={loading}>
            <IoClose />
          </button>
        </div>

        <div className="modal-form">
          {error && (
            <div style={{ padding: "10px", marginBottom: "16px", backgroundColor: "#fee", color: "#c33", borderRadius: "6px" }}>
              {error}
            </div>
          )}

          {success && (
            <div style={{ padding: "10px", marginBottom: "16px", backgroundColor: "#eaffea", color: "#116b11", borderRadius: "6px" }}>
              AI article generated successfully{createdArticle?.id ? ` (ID: ${createdArticle.id})` : ""}.
            </div>
          )}

          {loading ? (
            <div className="loader">
              <SpinnerDotted size={60} thickness={125} speed={100} color="#f01010ff" />
              <h3>Generating...</h3>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <div>
                  <label htmlFor="ai-category">Category *</label>
                  <select
                    id="ai-category"
                    name="category"
                    value={form.category}
                    onChange={handleChange}
                    required
                  >
                    <option value="blood">Blood</option>
                    <option value="organ">Organ</option>
                    <option value="health">Health</option>
                  </select>
                </div>
              </div>

              {articleJson ? (
                <div className="form-group">
                  <div style={{ width: "100%" }}>
                    <label>Generated Article JSON</label>
                    <textarea value={JSON.stringify(articleJson, null, 2)} readOnly rows="10" />
                    <small style={{ display: "block", marginTop: "6px", color: "#666" }}>
                      This JSON is already saved into the database as a new article (author: N/A) and will appear in the table after refresh.
                    </small>
                  </div>
                </div>
              ) : null}

              <div className="form-submit-btn">
                <button type="submit" className="submit-btn">
                  Generate
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}

