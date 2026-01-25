import { useEffect, useMemo, useState } from "react";
import { IoClose } from "react-icons/io5";
import { SpinnerDotted } from "spinners-react";
import api from "../../../api/axios";

const resolveImageUrl = (img) => {
  if (!img) return null;
  const s = String(img);
  if (s.startsWith("data:image")) return s;
  if (s.startsWith("http://") || s.startsWith("https://")) return s;
  const base = api?.defaults?.baseURL || "";
  return `${String(base).replace(/\/$/, "")}/${s.replace(/^\//, "")}`;
};

export default function EditArticleForm({ onClose, onArticleUpdated, articleCode, initialArticle }) {
  const code = useMemo(() => articleCode || initialArticle?.code || initialArticle?.id, [articleCode, initialArticle]);

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [imagePreview, setImagePreview] = useState(resolveImageUrl(initialArticle?.image));
  const [error, setError] = useState("");

  // imageAction: keep | new | remove
  const [imageAction, setImageAction] = useState("keep");

  const [form, setForm] = useState({
    title: initialArticle?.title || "",
    description: initialArticle?.description || "",
    content: initialArticle?.content || "",
    category: initialArticle?.category || "",
    is_published: Boolean(initialArticle?.is_published),
    image: null, // base64 for new
  });

  useEffect(() => {
    const fetchDetails = async () => {
      if (!code) return;
      setFetching(true);
      setError("");
      try {
        const res = await api.get(`/api/admin/dashboard/articles/${code}`);
        const article = res.data?.article;
        if (article) {
          setForm({
            title: article.title || "",
            description: article.description || "",
            content: article.content || "",
            category: article.category || "",
            is_published: Boolean(article.is_published),
            image: null,
          });
          setImagePreview(resolveImageUrl(article.image));
          setImageAction("keep");
        }
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load article details");
      } finally {
        setFetching(false);
      }
    };

    fetchDetails();
  }, [code]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];

      if (file.size > 5 * 1024 * 1024) {
        setError("File size exceeds 5MB limit. Please choose a smaller image.");
        e.target.value = "";
        return;
      }

      if (!file.type.match("image.*")) {
        setError("Please select a valid image file (JPG, PNG, or GIF).");
        e.target.value = "";
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
        setForm((prev) => ({ ...prev, image: reader.result }));
        setImageAction("new");
        setError("");
      };
      reader.onerror = () => {
        setError("Error reading file. Please try again.");
        e.target.value = "";
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setImagePreview(null);
    setForm((prev) => ({ ...prev, image: null }));
    setImageAction("remove");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!code) {
      setError("Missing article code");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await api.get("/sanctum/csrf-cookie");

      const payload = {
        title: form.title,
        description: form.description,
        content: form.content || null,
        category: form.category,
        is_published: Boolean(form.is_published),
      };

      if (imageAction === "new") {
        payload.image = form.image; // base64
      } else if (imageAction === "remove") {
        payload.image = ""; // tells backend to remove
      }

      await api.put(`/api/admin/dashboard/articles/${code}`, payload);

      onArticleUpdated?.();
      onClose?.();
    } catch (err) {
      console.error("❌ Error updating article:", err);
      if (err.response?.data?.errors) {
        const errorMessages = Object.values(err.response.data.errors).flat();
        setError(errorMessages.join(", "));
      } else {
        setError(err.response?.data?.message || "Failed to update article. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="modal">
      <div className="modal-container">
        {fetching ? (
          <div className="loader">
            <SpinnerDotted size={60} thickness={125} speed={100} color="#f01010ff" />
            <h3>Loading Article...</h3>
          </div>
        ) : (
          <>
            <div className="modal-title">
              <h2>Edit Article</h2>
              <button onClick={onClose} disabled={loading}>
                <IoClose />
              </button>
            </div>

            <div className="modal-form">
              {error && (
                <div style={{ padding: "10px", marginBottom: "20px", backgroundColor: "#fee", color: "#c33", borderRadius: "5px" }}>
                  {error}
                </div>
              )}

              {!loading ? (
                <form onSubmit={handleSubmit}>
                  <div className="form-group">
                    <div>
                      <label htmlFor="title">Article Title *</label>
                      <input
                        id="title"
                        type="text"
                        name="title"
                        value={form.title}
                        placeholder="Enter article title"
                        onChange={handleChange}
                        required
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <div>
                      <label htmlFor="category">Category *</label>
                      <input
                        id="category"
                        type="text"
                        name="category"
                        value={form.category}
                        placeholder="e.g., Blood Donation, Organ Donation"
                        onChange={handleChange}
                        required
                      />
                    </div>
                    <div>
                      <label>
                        {" "}Publish
                      </label>
                        <input
                          type="checkbox"
                          name="is_published"
                          checked={form.is_published}
                          onChange={handleChange}
                        />
                    </div>
                  </div>

                  <div className="form-group">
                    <div style={{ width: "100%" }}>
                      <label htmlFor="description">Description * (Short excerpt)</label>
                      <textarea
                        id="description"
                        name="description"
                        value={form.description}
                        placeholder="Enter a short description/excerpt for the article"
                        onChange={handleChange}
                        rows="3"
                        required
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <div style={{ width: "100%" }}>
                      <label htmlFor="content">Content (Full article text - optional)</label>
                      <textarea
                        id="content"
                        name="content"
                        value={form.content}
                        placeholder="Enter the full article content (optional)"
                        onChange={handleChange}
                        rows="8"
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <div style={{ width: "100%" }}>
                      <label>Article Image</label>
                      {imagePreview ? (
                        <div style={{ marginBottom: "10px" }}>
                          <img
                            src={imagePreview}
                            alt="Preview"
                            style={{ maxWidth: "100%", maxHeight: "200px", borderRadius: "5px", marginBottom: "10px" }}
                          />
                          <button
                            type="button"
                            onClick={handleRemoveImage}
                            style={{ padding: "5px 10px", backgroundColor: "#dc3545", color: "white", border: "none", borderRadius: "3px", cursor: "pointer" }}
                          >
                            Remove Image
                          </button>
                        </div>
                      ) : (
                        <div>
                          <label className="file-upload-btn" style={{ display: "inline-block", padding: "10px 20px", borderRadius: "5px", cursor: "pointer" }}>
                            Choose Image
                            <input
                              type="file"
                              accept="image/jpeg,image/png,image/gif"
                              onChange={handleFileChange}
                              style={{ display: "none" }}
                            />
                          </label>
                          <small style={{ display: "block", marginTop: "5px", color: "#666" }}>JPG, PNG or GIF. Max size 5MB</small>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="form-submit-btn">
                    <button type="submit" className="submit-btn">
                      Save Changes
                    </button>
                  </div>
                </form>
              ) : (
                <div className="loader">
                  <SpinnerDotted size={60} thickness={125} speed={100} color="#f01010ff" />
                  <h3>Saving...</h3>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </section>
  );
}

