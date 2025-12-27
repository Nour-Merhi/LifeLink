import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { IoArrowBack, IoCalendarOutline, IoTimeOutline } from "react-icons/io5";
import { FiTag } from "react-icons/fi";
import Navbar from "../components/Navbar";
import "../styles/Articles.css";

export default function ArticleDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [article, setArticle] = useState(null);
    const [loading, setLoading] = useState(true);

    // Sample articles data - in production, this would come from an API
    const articlesData = [
        {
            id: 1,
            title: "The Complete Guide to Blood Donation: What You Need to Know",
            description: "Everything from eligibility requirements to the donation process, plus how your donation saves lives and health benefits for donors.",
            image: "https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=800&h=400&fit=crop",
            category: "Blood Donation",
            date: "2024-01-15",
            author: "Dr. Sarah Johnson",
            readTime: "8 min read",
            content: `
                <h2>Introduction to Blood Donation</h2>
                <p>Blood donation is one of the most impactful ways you can contribute to saving lives. Every donation can help up to three people in need, making it a simple yet powerful act of kindness.</p>
                
                <h2>Eligibility Requirements</h2>
                <p>To donate blood, you must meet certain criteria:</p>
                <ul>
                    <li>Be at least 18 years old (or 16-17 with parental consent in some regions)</li>
                    <li>Weigh at least 110 pounds (50 kg)</li>
                    <li>Be in good general health</li>
                    <li>Have a valid ID</li>
                    <li>Not have donated blood in the last 56 days</li>
                </ul>
                
                <h2>The Donation Process</h2>
                <p>The entire blood donation process takes about an hour, but the actual donation only takes 10-15 minutes:</p>
                <ol>
                    <li><strong>Registration:</strong> You'll provide basic information and show your ID.</li>
                    <li><strong>Health Screening:</strong> A brief medical history and mini-physical exam to ensure you're eligible.</li>
                    <li><strong>Donation:</strong> A sterile needle is used to collect one pint of blood.</li>
                    <li><strong>Recovery:</strong> You'll rest for 10-15 minutes and enjoy refreshments.</li>
                </ol>
                
                <h2>Health Benefits for Donors</h2>
                <p>Regular blood donation offers several health benefits:</p>
                <ul>
                    <li>Reduces iron levels, which may lower the risk of heart disease</li>
                    <li>Stimulates the production of new blood cells</li>
                    <li>Provides a free health checkup (blood pressure, pulse, temperature, and hemoglobin levels)</li>
                    <li>Burns calories (approximately 650 calories per donation)</li>
                </ul>
                
                <h2>How Your Donation Saves Lives</h2>
                <p>Your donated blood can be used in various ways:</p>
                <ul>
                    <li><strong>Whole Blood:</strong> Used for trauma patients, surgeries, and general transfusions</li>
                    <li><strong>Red Blood Cells:</strong> Help patients with anemia, blood loss, or cancer</li>
                    <li><strong>Platelets:</strong> Essential for cancer patients and those with clotting disorders</li>
                    <li><strong>Plasma:</strong> Used for burn victims and patients with clotting factor deficiencies</li>
                </ul>
                
                <h2>Preparing for Your Donation</h2>
                <p>To ensure a successful donation:</p>
                <ul>
                    <li>Eat a healthy meal before donating</li>
                    <li>Drink plenty of water (at least 16 oz before and after)</li>
                    <li>Get a good night's sleep</li>
                    <li>Avoid fatty foods before donation</li>
                    <li>Bring a list of medications you're taking</li>
                </ul>
                
                <h2>After Your Donation</h2>
                <p>Following your donation, it's important to:</p>
                <ul>
                    <li>Rest for at least 10-15 minutes</li>
                    <li>Drink extra fluids for the next 24-48 hours</li>
                    <li>Avoid strenuous physical activity for the rest of the day</li>
                    <li>Keep the bandage on for several hours</li>
                    <li>Eat iron-rich foods to replenish your body</li>
                </ul>
                
                <h2>Conclusion</h2>
                <p>Blood donation is a safe, simple process that can save multiple lives. By donating regularly, you become part of a community of heroes who make a real difference in people's lives. Every donation counts, and your contribution helps ensure that blood is available when patients need it most.</p>
            `
        },
        {
            id: 2,
            title: "Understanding Organ Donation: A Comprehensive Overview",
            description: "Learn about the different types of organ donation, the registration process, and how organ matching works to save lives.",
            image: "https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=800&h=400&fit=crop",
            category: "Organ Donation",
            date: "2024-01-20",
            author: "Dr. Michael Chen",
            readTime: "12 min read",
            content: `
                <h2>What is Organ Donation?</h2>
                <p>Organ donation is the process of giving an organ or organs to help save or improve the lives of others. One organ donor can save up to 8 lives and improve the quality of life for many more through tissue donation.</p>
                
                <h2>Types of Organ Donation</h2>
                <h3>Living Donation</h3>
                <p>Living donation occurs when a living person donates an organ or part of an organ to another person. Common living donations include:</p>
                <ul>
                    <li><strong>Kidney:</strong> The most common living donation, as people can live healthy lives with one kidney</li>
                    <li><strong>Liver:</strong> A portion of the liver can be donated, as it regenerates in both the donor and recipient</li>
                    <li><strong>Lung:</strong> A lobe of a lung can be donated</li>
                    <li><strong>Bone Marrow:</strong> Can be donated multiple times</li>
                </ul>
                
                <h3>Deceased Donation</h3>
                <p>Deceased donation occurs when organs are donated after a person has died. This can happen in two ways:</p>
                <ul>
                    <li><strong>Brain Death:</strong> When brain function has permanently stopped, but the heart is still beating with life support</li>
                    <li><strong>Circulatory Death:</strong> When the heart and breathing have permanently stopped</li>
                </ul>
                
                <h2>The Organ Matching Process</h2>
                <p>Organ matching is a complex process that considers several factors:</p>
                <ul>
                    <li><strong>Blood Type:</strong> Must be compatible between donor and recipient</li>
                    <li><strong>Tissue Type:</strong> Human Leukocyte Antigen (HLA) matching</li>
                    <li><strong>Organ Size:</strong> Must be appropriate for the recipient's body size</li>
                    <li><strong>Medical Urgency:</strong> Patients in critical condition may receive priority</li>
                    <li><strong>Geographic Location:</strong> Proximity affects organ viability</li>
                    <li><strong>Time on Waiting List:</strong> Generally, longer wait times increase priority</li>
                </ul>
                
                <h2>How to Register as an Organ Donor</h2>
                <p>Registering as an organ donor is simple:</p>
                <ol>
                    <li>Sign up through your state's donor registry</li>
                    <li>Indicate your decision on your driver's license</li>
                    <li>Inform your family about your decision</li>
                    <li>Consider carrying an organ donor card</li>
                </ol>
                
                <h2>Common Myths About Organ Donation</h2>
                <p><strong>Myth:</strong> Doctors won't try as hard to save my life if I'm a donor.</p>
                <p><strong>Fact:</strong> Medical professionals prioritize saving your life. Organ donation is only considered after all life-saving efforts have failed.</p>
                
                <p><strong>Myth:</strong> I'm too old to donate.</p>
                <p><strong>Fact:</strong> There's no age limit for organ donation. Medical condition is more important than age.</p>
                
                <p><strong>Myth:</strong> My religion doesn't allow organ donation.</p>
                <p><strong>Fact:</strong> Most major religions support organ donation as an act of charity and saving lives.</p>
                
                <h2>Conclusion</h2>
                <p>Organ donation is a life-saving gift that can transform the lives of recipients and their families. By registering as a donor, you're making a commitment to help others even after you're gone. Every registration matters, and your decision can bring hope to those waiting for a second chance at life.</p>
            `
        },
        // Add more articles with full content as needed
    ];

    useEffect(() => {
        // Simulate API call - in production, fetch from backend
        const foundArticle = articlesData.find(a => a.id === parseInt(id));
        if (foundArticle) {
            setArticle(foundArticle);
        }
        setLoading(false);
    }, [id]);

    if (loading) {
        return (
            <>
                <Navbar />
                <div className="article-detail-loading">
                    <p>Loading article...</p>
                </div>
            </>
        );
    }

    if (!article) {
        return (
            <>
                <Navbar />
                <div className="article-detail-error">
                    <h2>Article Not Found</h2>
                    <p>The article you're looking for doesn't exist.</p>
                    <button onClick={() => navigate('/articles')} className="back-to-articles-btn">
                        Back to Articles
                    </button>
                </div>
            </>
        );
    }

    return (
        <>
            <Navbar />
            <section className="article-detail-page">
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
                                    {new Date(article.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                                </span>
                                <span className="meta-item">
                                    <IoTimeOutline />
                                    {article.readTime}
                                </span>
                                {article.author && (
                                    <span className="meta-item">
                                        By {article.author}
                                    </span>
                                )}
                            </div>
                        </div>
                        <h1 className="article-detail-title">{article.title}</h1>
                        <p className="article-detail-subtitle">{article.description}</p>
                    </div>

                    {/* Article Image */}
                    <div className="article-detail-image-container">
                        <img
                            src={article.image}
                            alt={article.title}
                            className="article-detail-image"
                            onError={(e) => {
                                e.target.src = 'https://via.placeholder.com/800x400?text=Article+Image';
                            }}
                        />
                    </div>

                    {/* Article Content */}
                    <div className="article-detail-content">
                        <div 
                            className="article-body"
                            dangerouslySetInnerHTML={{ __html: article.content }}
                        />
                    </div>

                    {/* Share Section */}
                    <div className="article-share-section">
                        <h3>Share this article</h3>
                        <div className="share-buttons">
                            <button className="share-btn">Facebook</button>
                            <button className="share-btn">Twitter</button>
                            <button className="share-btn">LinkedIn</button>
                            <button className="share-btn">Email</button>
                        </div>
                    </div>

                    {/* Related Articles */}
                    <div className="related-articles">
                        <h2>Related Articles</h2>
                        <div className="related-articles-grid">
                            {articlesData
                                .filter(a => a.id !== article.id && a.category === article.category)
                                .slice(0, 3)
                                .map((relatedArticle) => (
                                    <div 
                                        key={relatedArticle.id} 
                                        className="related-article-card"
                                        onClick={() => navigate(`/articles/${relatedArticle.id}`)}
                                    >
                                        <img 
                                            src={relatedArticle.image} 
                                            alt={relatedArticle.title}
                                            className="related-article-image"
                                        />
                                        <div className="related-article-content">
                                            <h4>{relatedArticle.title}</h4>
                                            <p>{relatedArticle.description.substring(0, 100)}...</p>
                                        </div>
                                    </div>
                                ))}
                        </div>
                    </div>
                </div>
            </section>
        </>
    );
}

