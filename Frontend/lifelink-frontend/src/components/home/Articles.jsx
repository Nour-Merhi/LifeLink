import { useNavigate } from "react-router-dom";
import { RiArticleLine } from "react-icons/ri";
import { IoArrowForward } from "react-icons/io5";
import { useEffect, useRef, useState } from "react";
import { useArticles } from "../../context/ArticlesContext";
import { API_BASE_URL } from "../../config/api";
import "../../styles/Articles.css";

function getArticleImageSrc(article) {
  const src = article?.image_url ?? article?.image;
  if (!src) return "/image.png";
  if (typeof src === "string" && (src.startsWith("http") || src.startsWith("data:"))) return src;
  const base = (API_BASE_URL || "").replace(/\/$/, "");
  const path = typeof src === "string" && src.startsWith("/") ? src.slice(1) : src;
  return base ? `${base}/${path}` : "/image.png";
}

export default function ArticlesSection() {
  const navigate = useNavigate();
  const { articles, loading, error, fetchArticles } = useArticles();
  const [visibleArticles, setVisibleArticles] = useState([]);
  const articleRefs = useRef([]);

  const displayedArticles = articles.slice(0, 6);

  useEffect(() => {
    fetchArticles(true);
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const articleId = parseInt(entry.target.dataset.articleId);
            setVisibleArticles((prev) => {
              if (!prev.includes(articleId)) {
                return [...prev, articleId];
              }
              return prev;
            });
          }
        });
      },
      { threshold: 0.1 }
    );

    articleRefs.current.forEach((ref) => {
      if (ref) observer.observe(ref);
    });

    return () => {
      articleRefs.current.forEach((ref) => {
        if (ref) observer.unobserve(ref);
      });
    };
  }, [displayedArticles]);

  return (
    <section className="bg-gradient-to-r from-black to-gray-900 text-white px-35 py-16 articles-section">
      <div className="mb-12 max-w-4xl text-center mx-auto">
        <p className="text-gray-400 mb-2 text-sm uppercase tracking-wider">
          News
        </p>
        <h2 className="text-3xl font-bold mb-2">
          Health & Donation Articles
        </h2>
        <p className="text-gray-400 !text-[16px]">
          Stay informed with the latest research, guides, and insights about blood, organ donation, and health topics from our medical experts.
        </p>
      </div>

      <div className="max-w-6xl mx-auto">
        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-400">Loading articles...</p>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-gray-400">{error}</p>
          </div>
        ) : displayedArticles.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
            {displayedArticles.map((article, index) => {
              const articleId = article.id;
              const isVisible = visibleArticles.includes(articleId);
              const imageSrc = getArticleImageSrc(article);
              
              return (
                <article
                  key={articleId}
                  ref={(el) => (articleRefs.current[index] = el)}
                  data-article-id={articleId}
                  className={`article-card-home bg-[#2a2a2a] rounded-xl overflow-hidden flex flex-col transition-all duration-600 ease-out cursor-pointer ${
                    isVisible
                      ? 'opacity-100 translate-y-0'
                      : 'opacity-0 translate-y-8'
                  }`}
                  style={{ transitionDelay: `${index * 100}ms` }}
                  onClick={() => navigate(`/articles/${articleId}`)}
                >
                  <div className="article-image-container-home relative overflow-hidden">
                    <img
                      src={imageSrc}
                      alt={article.title}
                      className="w-full h-48 object-cover transition-transform duration-600 hover:scale-110"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = '/image.png';
                      }}
                    />
                    <span className="article-category absolute top-3 left-3 bg-red-600 text-white text-xs font-semibold px-3 py-1 rounded-full uppercase">
                      {article.category}
                    </span>
                  </div>
                  <div className="pt-4 px-4 pb-4 flex flex-col flex-grow">
                    <h3 className="font-semibold text-white text-base mb-2 leading-snug">
                      {article.title}
                    </h3>
                    <p className="!text-sm text-gray-400 text-justify flex-grow leading-relaxed mb-4">
                      {article.description}
                    </p>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/articles/${articleId}`);
                      }}
                      className="read-article-btn-home bg-gradient-to-r from-red-700 to-red-600 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 text-sm font-semibold transition-all duration-300 hover:from-red-600 hover:to-red-500 hover:shadow-lg hover:scale-105 w-fit group"
                    >
                      Read Article
                      <IoArrowForward className="text-base transition-transform duration-300 group-hover:translate-x-1" />
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-400">No articles available at the moment.</p>
          </div>
        )}
      </div>
      <div className="mt-20 flex justify-center">
        <button
          onClick={() => navigate("/articles")}
          className="flex flex-row gap-2 rounded-lg border border-white/30 bg-white/10 px-6 py-3 items-center justify-center hover:bg-white/20 hover:border-white/50 transition-all duration-300 hover:scale-105 backdrop-blur-sm"
        >
          <RiArticleLine className="text-white text-xl" />
          <span className="text-white font-semibold">View More Articles</span>
        </button>
      </div>

    </section>
  );
}
