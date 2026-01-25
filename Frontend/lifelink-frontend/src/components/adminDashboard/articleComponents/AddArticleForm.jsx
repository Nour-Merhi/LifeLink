import { useState } from "react";
import { IoClose } from "react-icons/io5";
import { SpinnerDotted } from 'spinners-react';
import api from "../../../api/axios";

export default function AddArticleForm({ onClose, onArticleAdded }) {
    const [loading, setLoading] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [imagePreview, setImagePreview] = useState(null);
    const [error, setError] = useState("");

    const [addArticleData, setAddArticleData] = useState({
        title: "",
        description: "",
        content: "",
        image: null,
        category: "",
        is_published: false,
    });

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setAddArticleData((prev) => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value,
        }));
    };

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            
            // Check file size (5MB limit)
            if (file.size > 5 * 1024 * 1024) {
                setError("File size exceeds 5MB limit. Please choose a smaller image.");
                e.target.value = '';
                return;
            }
            
            // Check file type
            if (!file.type.match('image.*')) {
                setError("Please select a valid image file (JPG, PNG, or GIF).");
                e.target.value = '';
                return;
            }
            
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result);
                setAddArticleData(prev => ({
                    ...prev,
                    image: reader.result // Store base64 string
                }));
                setError("");
            };
            reader.onerror = () => {
                setError("Error reading file. Please try again.");
                e.target.value = '';
            };
            reader.readAsDataURL(file);
        }
    };

    const handleRemoveImage = () => {
        setImagePreview(null);
        setAddArticleData(prev => ({
            ...prev,
            image: null
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            await api.get("/sanctum/csrf-cookie");

            const response = await api.post(
                "/api/admin/dashboard/articles",
                addArticleData
            );

            setShowSuccess(true);
            setTimeout(() => {
                setShowSuccess(false);
                setAddArticleData({
                    title: "",
                    description: "",
                    content: "",
                    image: null,
                    category: "",
                    is_published: false,
                });
                setImagePreview(null);
                if (onArticleAdded) {
                    onArticleAdded();
                } else {
                    onClose();
                }
            }, 1200);
        } catch (err) {
            console.error("❌ Error adding article:", err);
            if (err.response?.data?.errors) {
                const errorMessages = Object.values(err.response.data.errors).flat();
                setError(errorMessages.join(", "));
            } else {
                setError(err.response?.data?.message || "Failed to add article. Please try again.");
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <section className="modal">
            <div className="modal-container">
                {showSuccess && (
                    <div className="success-overlay">
                        <div className="success-check">
                            <svg viewBox="0 0 52 52">
                                <path className="checkmark__circle" d="M26 2c13.255 0 24 10.745 24 24S39.255 50 26 50 2 39.255 2 26 12.745 2 26 2z"/>
                                <path className="checkmark__check" d="M14 27l7 7 17-17"/>
                            </svg>
                            <div className="success-text">Article added successfully</div>
                        </div>
                    </div>
                )}
                {!loading ? (
                    <>
                        <div className="modal-title">
                            <h2>Add New Article</h2>
                            <button onClick={onClose}><IoClose /></button>
                        </div>

                        <div className="modal-form">
                            {error && (
                                <div style={{ padding: "10px", marginBottom: "20px", backgroundColor: "#fee", color: "#c33", borderRadius: "5px" }}>
                                    {error}
                                </div>
                            )}
                            <form onSubmit={handleSubmit}>
                                <div className="form-group">
                                    <div>
                                        <label htmlFor="title">Article Title *</label>
                                        <input
                                            id="title"
                                            type="text"
                                            name="title"
                                            value={addArticleData.title}
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
                                            value={addArticleData.category}
                                            placeholder="e.g., Blood Donation, Organ Donation"
                                            onChange={handleChange}
                                            required
                                        />
                                    </div>
                                    <div  className="m-auto">
                                        <label>
                                            <input
                                                type="checkbox"
                                                name="is_published"
                                                checked={addArticleData.is_published}
                                                onChange={handleChange}
                                            />
                                            {' '}Publish immediately
                                        </label>
                                    </div>
                                </div>

                                <div className="form-group">
                                    <div style={{ width: '100%' }}>
                                        <label htmlFor="description">Description * (Short excerpt)</label>
                                        <textarea
                                            id="description"
                                            name="description"
                                            value={addArticleData.description}
                                            placeholder="Enter a short description/excerpt for the article"
                                            onChange={handleChange}
                                            rows="3"
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="form-group">
                                    <div style={{ width: '100%' }}>
                                        <label htmlFor="content">Content (Full article text - optional)</label>
                                        <textarea
                                            id="content"
                                            name="content"
                                            value={addArticleData.content}
                                            placeholder="Enter the full article content (optional)"
                                            onChange={handleChange}
                                            rows="8"
                                        />
                                    </div>
                                </div>

                                <div className="form-group">
                                    <div style={{ width: '100%' }}>
                                        <label>Article Image</label>
                                        {imagePreview ? (
                                            <div style={{ marginBottom: '10px' }}>
                                                <img 
                                                    src={imagePreview} 
                                                    alt="Preview" 
                                                    style={{ maxWidth: '100%', maxHeight: '200px', borderRadius: '5px', marginBottom: '10px' }}
                                                />
                                                <button 
                                                    type="button"
                                                    onClick={handleRemoveImage}
                                                    style={{ padding: '5px 10px', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '3px', cursor: 'pointer' }}
                                                >
                                                    Remove Image
                                                </button>
                                            </div>
                                        ) : (
                                            <div>
                                                <label className="file-upload-btn" style={{ display: 'inline-block', padding: '10px 20px', backgroundColor: '#f0f0f0', borderRadius: '5px', cursor: 'pointer' }}>
                                                    Choose Image
                                                    <input 
                                                        type="file" 
                                                        accept="image/jpeg,image/png,image/gif"
                                                        onChange={handleFileChange}
                                                        style={{ display: 'none' }}
                                                    />
                                                </label>
                                                <small style={{ display: 'block', marginTop: '5px', color: '#666' }}>JPG, PNG or GIF. Max size 5MB</small>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="form-submit-btn">
                                    <button type="submit" className="submit-btn">
                                        Add Article
                                    </button>
                                </div>
                            </form>
                        </div>
                    </>
                ) : (
                    <div className="loader">
                        <SpinnerDotted size={60} thickness={125} speed={100} color="#f01010ff" />
                        <h3>Adding Article...</h3>
                    </div>
                )}
            </div>
        </section>
    );
}

