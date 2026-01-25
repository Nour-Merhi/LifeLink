import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { IoArrowBack, IoCalendarOutline, IoTimeOutline } from "react-icons/io5";
import { FiTag } from "react-icons/fi";
import Navbar from "../components/Navbar";
import api from "../api/axios";
import { useArticles } from "../context/ArticlesContext";
import "../styles/Articles.css";

export default function ArticleDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { articles, getArticleById, getArticlesByCategory } = useArticles();
    const [article, setArticle] = useState(null);
    const [relatedArticles, setRelatedArticles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const fetchArticle = async () => {
            try {
                setLoading(true);
                setError("");
                
                // First try to get from context (shared articles)
                let articleData = getArticleById(id);
                
                // If not in context, fetch from API (might be a new article)
                if (!articleData) {
                    const response = await api.get(`/api/articles/${id}`);
                    articleData = response.data.article || response.data;
                }
                
                setArticle(articleData);
                
                // Get related articles from context
                if (articleData?.category) {
                    const related = getArticlesByCategory(articleData.category)
                        .filter(a => a.id !== parseInt(id) && a.is_published)
                        .slice(0, 3);
                    setRelatedArticles(related);
                }
            } catch (err) {
                console.error('Error fetching article:', err);
                setError(err.response?.data?.message || 'Failed to load article');
            } finally {
                setLoading(false);
            }
        };

        if (id) {
            fetchArticle();
        }
    }, [id, articles, getArticleById, getArticlesByCategory]);

    // Calculate read time based on content length
    const calculateReadTime = (content) => {
        if (!content) return '5 min read';
        const wordsPerMinute = 200;
        const words = content.split(/\s+/).length;
        const minutes = Math.ceil(words / wordsPerMinute);
        return `${minutes} min read`;
    };

    const baseURL = api?.defaults?.baseURL || "http://localhost:8000";
    const resolveImageSrc = (image) => {
        if (!image) return "/image.png";
        const img = String(image);
        if (img.startsWith("http")) return img;
        return `${baseURL}${img.startsWith("/") ? "" : "/"}${img}`;
    };

    // Format content for display (convert plain text to HTML paragraphs)
    const formatContent = (content) => {
        if (!content) return '';
        // If content contains HTML tags, return as is
        if (content.includes('<')) {
            return content;
        }
        // Otherwise, convert newlines to paragraphs
        return content
            .split('\n\n')
            .filter(para => para.trim())
            .map(para => `<p>${para.trim()}</p>`)
            .join('');
    };

    if (loading) {
        return (
            <>
                <Navbar />
                <div className="article-detail-loading" style={{ padding: '4rem', textAlign: 'center', color: '#999' }}>
                    <p>Loading article...</p>
                </div>
            </>
        );
    }

    if (error || !article) {
        return (
            <>
                <div className="article-detail-page">
                    <Navbar />
                    <div className="article-detail-error" style={{ padding: '4rem', textAlign: 'center' }}>
                        <h2>Article Not Found</h2>
                        <p>{error || "The article you're looking for doesn't exist."}</p>
                        <button onClick={() => navigate('/articles')} className="back-to-articles-btn" style={{
                            marginTop: '1rem',
                            padding: '0.75rem 1.5rem',
                            backgroundColor: '#F12C31',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            cursor: 'pointer'
                        }}>
                            Back to Articles
                        </button>
                    </div>
                </div>
            </>
        );
    }

    const imageSrc = resolveImageSrc(article.image);
    const publishedDate = article.published_at || article.created_at;
    const authorName = article.author 
        ? `${article.author.first_name || ''} ${article.author.last_name || ''}`.trim() || 'AI'
        : 'AI';
    const readTime = calculateReadTime(article.content);
    const formattedContent = formatContent(article.content);

    return (
        <>
            <section className="article-detail-page">
                <Navbar />
                <div className="article-detail-container">
                    {/* Back Button */}
                    <button onClick={() => navigate('/articles')} className="back-button">
                        <IoArrowBack />
                        Back to Articles
                    </button>

                    {/* Article Header */}
                    <div className="article-detail-header">
                        <div className="article-meta">
                            <span className="article-category-badge">
                                <FiTag />
                                {article.category}
                            </span>
                            <div className="article-meta-info">
                                <span className="meta-item">
                                    <IoCalendarOutline />
                                    {publishedDate 
                                        ? new Date(publishedDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
                                        : 'No date'
                                    }
                                </span>
                                <span className="meta-item">
                                    <IoTimeOutline />
                                    {readTime}
                                </span>
                                <span className="meta-item">
                                    By {authorName}
                                </span>
                            </div>
                        </div>
                        <h1 className="article-detail-title">{article.title}</h1>
                        <p className="article-detail-subtitle">{article.description}</p>
                    </div>

                    {/* Article Image */}
                    {article.image && (
                        <div className="article-detail-image-container">
                            <img
                                src={imageSrc}
                                alt={article.title}
                                className="article-detail-image"
                                onError={(e) => {
                                    e.target.src = 'https://via.placeholder.com/800x400?text=Article+Image';
                                }}
                            />
                        </div>
                    )}

                    {/* Article Content */}
                    <div className="article-detail-content">
                        <div 
                            className="article-body"
                            dangerouslySetInnerHTML={{ __html: formattedContent || article.description }}
                        />
                    </div>

                    {/* Share Section */}
                    <div className="article-share-section">
                        <h3>Share this article</h3>
                        <div className="share-buttons">
                            <button 
                                className="share-btn"
                                onClick={() => window.open(`https://www.facebook.com/sharer/sharer.php?u=${window.location.href}`, '_blank')}
                            >
                                Facebook
                            </button>
                            <button 
                                className="share-btn"
                                onClick={() => window.open(`https://twitter.com/intent/tweet?url=${window.location.href}&text=${encodeURIComponent(article.title)}`, '_blank')}
                            >
                                Twitter
                            </button>
                            <button 
                                className="share-btn"
                                onClick={() => window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${window.location.href}`, '_blank')}
                            >
                                LinkedIn
                            </button>
                            <button 
                                className="share-btn"
                                onClick={() => window.location.href = `mailto:?subject=${encodeURIComponent(article.title)}&body=${encodeURIComponent(window.location.href)}`}
                            >
                                Email
                            </button>
                        </div>
                    </div>

                    {/* Related Articles */}
                    {relatedArticles.length > 0 && (
                        <div className="related-articles">
                            <h2>Related Articles</h2>
                            <div className="related-articles-grid">
                                {relatedArticles.map((relatedArticle) => {
                                    const relatedImageSrc = resolveImageSrc(relatedArticle.image);
                                    
                                    return (
                                        <div 
                                            key={relatedArticle.id} 
                                            className="related-article-card"
                                            onClick={() => navigate(`/articles/${relatedArticle.id}`)}
                                            style={{ cursor: 'pointer' }}
                                        >
                                            <img 
                                                src={relatedImageSrc} 
                                                alt={relatedArticle.title}
                                                className="related-article-image"
                                                onError={(e) => {
                                                    e.target.src = 'https://via.placeholder.com/400x250?text=Article+Image';
                                                }}
                                            />
                                            <div className="related-article-content">
                                                <h4>{relatedArticle.title}</h4>
                                                <p>{relatedArticle.description?.substring(0, 100)}...</p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>
            </section>
        </>
    );
}
