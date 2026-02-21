import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { IoArrowForward } from "react-icons/io5";
import { FiSearch } from "react-icons/fi";
import Navbar from "../components/Navbar";
import { useArticles } from "../context/ArticlesContext";
import api from "../api/axios";
import { getApiBaseUrl } from "../config/api";
import "../styles/Articles.css";

export default function ArticlePage() {
    const [searchTerm, setSearchTerm] = useState("");
    const { articles, loading, error, fetchArticles } = useArticles();
    const navigate = useNavigate();

    // Force refresh so newly published articles show immediately (no 5-min cache delay)
    useEffect(() => {
        fetchArticles(true);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Filter articles based on search term
    const filteredArticles = articles.filter(article =>
        article.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        article.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        article.category?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const baseURL = api?.defaults?.baseURL || getApiBaseUrl();
    const resolveImageSrc = (image) => {
        if (!image) return "/image.png";
        const img = String(image);
        if (img.startsWith("http")) return img;
        return `${baseURL}${img.startsWith("/") ? "" : "/"}${img}`;
    };

    return (
        <>
            <section className="articles-page">
                <Navbar />
                <div className="articles-container">
                    {/* Header Section */}
                    <div className="articles-header">
                        <div className="articles-header-content">
                            <span className="articles-label">News</span>
                            <h1 className="articles-title">Health & Donation Articles</h1>
                            <p className="articles-description">
                                Stay informed with the latest research, guides, and insights about blood, organ donation, and health topics from our medical experts.
                            </p>
                        </div>

                        {/* Search Bar */}
                        <div className="articles-search">
                            <FiSearch className="search-icon" />
                            <input
                                type="text"
                                placeholder="Search articles..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="search-input"
                            />
                        </div>
                    </div>

                    {/* Loading State */}
                    {loading && (
                        <div style={{ textAlign: 'center', padding: '4rem', color: '#999' }}>
                            <p>Loading articles...</p>
                        </div>
                    )}

                    {/* Error State */}
                    {error && !loading && (
                        <div style={{ textAlign: 'center', padding: '4rem', color: '#F12C31' }}>
                            <p>{error}</p>
                        </div>
                    )}

                    {/* Articles Grid */}
                    {!loading && !error && (
                        <div className="articles-grid">
                            {filteredArticles.length > 0 ? (
                                filteredArticles.map((article) => {
                                    const imageSrc = resolveImageSrc(article.image);
                                    const publishedDate = article.published_at || article.created_at;
                                    
                                    return (
                                        <article key={article.id} className="article-card">
                                            <div className="article-image-container">
                                                <img
                                                    src={imageSrc}
                                                    alt={article.title}
                                                    className="article-image"
                                                    onError={(e) => {
                                                        e.target.src = 'https://via.placeholder.com/400x250?text=Article+Image';
                                                    }}
                                                />
                                                <span className="article-category">{article.category}</span>
                                            </div>
                                            <div className="article-content">
                                                <h3 className="article-title">{article.title}</h3>
                                                <p className="article-description">{article.description}</p>
                                                <div className="article-footer">
                                                    <span className="article-date">
                                                        {publishedDate 
                                                            ? new Date(publishedDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
                                                            : 'No date'
                                                        }
                                                    </span>
                                                    <button 
                                                        className="read-article-btn"
                                                        onClick={() => navigate(`/articles/${article.id}`)}
                                                    >
                                                        Read Article
                                                        <IoArrowForward className="arrow-icon" />
                                                    </button>
                                                </div>
                                            </div>
                                        </article>
                                    );
                                })
                            ) : (
                                <div className="no-articles">
                                    <p>{searchTerm ? 'No articles found matching your search.' : 'No articles available at the moment.'}</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </section>
        </>
    );
}
