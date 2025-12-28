import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { IoArrowForward } from "react-icons/io5";
import { FiSearch } from "react-icons/fi";
import Navbar from "../components/Navbar";
import "../styles/Articles.css";

export default function ArticlePage() {
    const [searchTerm, setSearchTerm] = useState("");
    const navigate = useNavigate();

    // Sample articles data - in production, this would come from an API
    const articles = [
        {
            id: 1,
            title: "The Complete Guide to Blood Donation: What You Need to Know",
            description: "Everything from eligibility requirements to the donation process, plus how your donation saves lives and health benefits for donors.",
            image: "https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=400&h=250&fit=crop",
            category: "Blood Donation",
            date: "2024-01-15"
        },
        {
            id: 2,
            title: "Understanding Organ Donation: A Comprehensive Overview",
            description: "Learn about the different types of organ donation, the registration process, and how organ matching works to save lives.",
            image: "https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=400&h=250&fit=crop",
            category: "Organ Donation",
            date: "2024-01-20"
        },
        {
            id: 3,
            title: "Health Benefits of Regular Blood Donation",
            description: "Discover the surprising health benefits that come with regular blood donation, including reduced risk of heart disease and improved circulation.",
            image: "https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=400&h=250&fit=crop",
            category: "Health & Wellness",
            date: "2024-01-25"
        },
        {
            id: 4,
            title: "Living Organ Donation: What You Should Know",
            description: "A detailed guide to living organ donation, including kidney and liver donation, eligibility criteria, and the recovery process.",
            image: "https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=400&h=250&fit=crop",
            category: "Organ Donation",
            date: "2024-02-01"
        },
        {
            id: 5,
            title: "After-Death Organ Donation: Making Your Wishes Known",
            description: "How to register as an organ donor, communicate your wishes to family, and ensure your legacy of life continues after death.",
            image: "https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=400&h=250&fit=crop",
            category: "Organ Donation",
            date: "2024-02-05"
        },
        {
            id: 6,
            title: "Preparing for Your First Blood Donation",
            description: "Step-by-step guide to prepare for your first blood donation, including what to eat, what to avoid, and what to expect during the process.",
            image: "https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=400&h=250&fit=crop",
            category: "Blood Donation",
            date: "2024-02-10"
        },
        {
            id: 7,
            title: "The Science Behind Organ Matching",
            description: "Understanding how medical professionals match organs to recipients, including blood type compatibility, tissue matching, and urgency factors.",
            image: "https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=400&h=250&fit=crop",
            category: "Medical Science",
            date: "2024-02-15"
        },
        {
            id: 8,
            title: "Common Myths About Blood Donation Debunked",
            description: "Separating fact from fiction: addressing common misconceptions about blood donation and providing accurate information to encourage more donors.",
            image: "https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=400&h=250&fit=crop",
            category: "Blood Donation",
            date: "2024-02-20"
        },
        {
            id: 9,
            title: "Organ Donation Statistics: Impact and Need",
            description: "Current statistics on organ donation, waiting lists, and the critical need for more donors to save lives across the country.",
            image: "https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=400&h=250&fit=crop",
            category: "Statistics",
            date: "2024-02-25"
        }
    ];

    // Filter articles based on search term
    const filteredArticles = articles.filter(article =>
        article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        article.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        article.category.toLowerCase().includes(searchTerm.toLowerCase())
    );

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

                    {/* Articles Grid */}
                    <div className="articles-grid">
                        {filteredArticles.length > 0 ? (
                            filteredArticles.map((article) => (
                                <article key={article.id} className="article-card">
                                    <div className="article-image-container">
                                        <img
                                            src={article.image}
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
                                            <span className="article-date">{new Date(article.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
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
                            ))
                        ) : (
                            <div className="no-articles">
                                <p>No articles found matching your search.</p>
                            </div>
                        )}
                    </div>

                </div>
            </section>
        </>
    );
}
