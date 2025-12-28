import { useNavigate } from "react-router-dom";
import { RiArticleLine } from "react-icons/ri";
import { IoArrowForward } from "react-icons/io5";
import { useEffect, useRef, useState } from "react";
import "../../styles/Articles.css";

const articles = [
  {
    id: 1,
    title: "The Complete Guide to Blood Donation: What You Need to Know",
    excerpt: "Everything from eligibility requirements to the donation process, plus how your donation saves lives and health benefits for donors.",
    imageSrc: "/image.png", 
    link: "/articles/1",
    category: "Blood Donation",
  },
  {
    id: 2,
    title: "Understanding Organ Donation: A Comprehensive Overview",
    excerpt: "Learn about the different types of organ donation, the registration process, and how organ matching works to save lives.",
    imageSrc: "/image.png",
    link: "/articles/2",
    category: "Organ Donation",
  },
  {
    id: 3,
    title: "Health Benefits of Regular Blood Donation",
    excerpt: "Discover the surprising health benefits that come with regular blood donation, including reduced risk of heart disease and improved circulation.",
    imageSrc: "/image.png",
    link: "/articles/3",
    category: "Health & Wellness",
  },
  {
    id: 4,
    title: "Living Organ Donation: What You Should Know",
    excerpt: "A detailed guide to living organ donation, including kidney and liver donation, eligibility criteria, and the recovery process.",
    imageSrc: "/image.png",
    link: "/articles/4",
    category: "Organ Donation",
  },
  {
    id: 5,
    title: "After-Death Organ Donation: Making Your Wishes Known",
    excerpt: "How to register as an organ donor, communicate your wishes to family, and ensure your legacy of life continues after death.",
    imageSrc: "/image.png",
    link: "/articles/5",
    category: "Organ Donation",
  },
  {
    id: 6,
    title: "Preparing for Your First Blood Donation",
    excerpt: "Step-by-step guide to prepare for your first blood donation, including what to eat, what to avoid, and what to expect during the process.",
    imageSrc: "/image.png",
    link: "/articles/6",
    category: "Blood Donation",
  },
];

export default function ArticlesSection() {
  const navigate = useNavigate();
  const [visibleArticles, setVisibleArticles] = useState([]);
  const articleRefs = useRef([]);

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
  }, []);

  return (
    <section className="bg-gradient-to-r from-black to-gray-900 text-white px-45 py-16">
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
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
          {articles.map(({ id, title, excerpt, imageSrc, link, category }, index) => {
            const isVisible = visibleArticles.includes(id);
            return (
              <article
                key={id}
                ref={(el) => (articleRefs.current[index] = el)}
                data-article-id={id}
                className={`article-card-home bg-[#2a2a2a] rounded-xl overflow-hidden flex flex-col transition-all duration-600 ease-out cursor-pointer ${
                  isVisible
                    ? 'opacity-100 translate-y-0'
                    : 'opacity-0 translate-y-8'
                }`}
                style={{ transitionDelay: `${index * 100}ms` }}
                onClick={() => navigate(link)}
              >
                <div className="article-image-container-home relative overflow-hidden">
                  <img
                    src={imageSrc}
                    alt={title}
                    className="w-full h-48 object-cover transition-transform duration-600 hover:scale-110"
                    onError={(e) => {
                      e.target.src = 'https://via.placeholder.com/400x250?text=Article+Image';
                    }}
                  />
                  <span className="article-category absolute top-3 left-3 bg-red-600 text-white text-xs font-semibold px-3 py-1 rounded-full uppercase">
                    {category}
                  </span>
                </div>
                <div className="pt-4 px-4 pb-4 flex flex-col flex-grow">
                  <h3 className="font-semibold text-white text-base mb-2 leading-snug">
                    {title}
                  </h3>
                  <p className="!text-sm text-gray-400 text-justify flex-grow leading-relaxed mb-4">
                    {excerpt}
                  </p>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(link);
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
