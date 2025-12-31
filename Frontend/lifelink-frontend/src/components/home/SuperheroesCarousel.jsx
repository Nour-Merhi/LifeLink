import { useRef, useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { IoIosArrowBack, IoIosArrowForward } from "react-icons/io";
import "./SuperheroesCarousel.css";

export default function SuperheroesCarousel({ heroes }) {
    const navigate = useNavigate();
    const carouselRef = useRef(null);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isAutoPlaying, setIsAutoPlaying] = useState(true);
    const isScrollingRef = useRef(false);

    const scrollToIndex = useCallback((index) => {
        if (carouselRef.current && index >= 0 && index < heroes.length) {
            isScrollingRef.current = true;
            setCurrentIndex(index); // Update index immediately
            const cardWidth = 250 + 5; // card width + gap (gap is 5px based on CSS)
            const scrollPosition = index * cardWidth;
            carouselRef.current.scrollTo({
                left: scrollPosition,
                behavior: "smooth",
            });
            
            // Reset scrolling flag after scroll completes
            setTimeout(() => {
                isScrollingRef.current = false;
            }, 600);
        }
    }, [heroes.length]);

    const scrollLeft = () => {
        if (currentIndex > 0) {
            scrollToIndex(currentIndex - 1);
        }
    };

    const scrollRight = () => {
        if (currentIndex < heroes.length - 1) {
            scrollToIndex(currentIndex + 1);
        }
    };

    // Auto-scroll functionality
    useEffect(() => {
        if (!isAutoPlaying || !carouselRef.current) return;

        const interval = setInterval(() => {
            setCurrentIndex((prevIndex) => {
                const nextIndex = prevIndex < heroes.length - 1 ? prevIndex + 1 : 0;
                // Scroll to the next index
                scrollToIndex(nextIndex);
                return nextIndex;
            });
        }, 3000); // Change slide every 3 seconds

        return () => clearInterval(interval);
    }, [isAutoPlaying, heroes.length]);

    // Update current index on scroll (only when user manually scrolls)
    useEffect(() => {
        const carousel = carouselRef.current;
        if (!carousel) return;

        const handleScroll = () => {
            // Don't update if we're programmatically scrolling
            if (isScrollingRef.current) return;
            
            const cardWidth = 250 + 5; // card width + gap
            const newIndex = Math.round(carousel.scrollLeft / cardWidth);
            // Ensure index is within bounds
            const clampedIndex = Math.max(0, Math.min(newIndex, heroes.length - 1));
            setCurrentIndex(clampedIndex);
        };

        // Use a throttled scroll handler
        let scrollTimeout;
        const throttledHandleScroll = () => {
            clearTimeout(scrollTimeout);
            scrollTimeout = setTimeout(handleScroll, 100);
        };

        carousel.addEventListener("scroll", throttledHandleScroll);
        
        return () => {
            carousel.removeEventListener("scroll", throttledHandleScroll);
            clearTimeout(scrollTimeout);
        };
    }, [heroes.length]);

    return (
        <div className="superheroes-carousel-container">
            <div 
                className="superheroes-carousel-wrapper"
                onMouseEnter={() => setIsAutoPlaying(false)}
                onMouseLeave={() => setIsAutoPlaying(true)}
            >
                <button 
                    className="carousel-nav-button carousel-nav-left"
                    onClick={scrollLeft}
                    disabled={currentIndex === 0}
                    aria-label="Previous hero"
                >
                    <IoIosArrowBack />
                </button>

                <div className="superheroes-carousel" ref={carouselRef}>
                    {heroes.map((hero, index) => (
                        <div
                            key={hero.id}
                            className={`hero-card ${index === currentIndex ? 'active' : ''}`}
                            onClick={() => navigate(hero.link)}
                        >
                            <div className="hero-card-image-wrapper">
                                <img
                                    src={hero.imgSrc}
                                    alt={hero.name}
                                    className="hero-card-image"
                                />
                                <div className="hero-card-overlay">
                                    <p className="hero-card-name">{hero.name}</p>
                                    {hero.type && (
                                        <p className="hero-card-type">{hero.type}</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                <button 
                    className="carousel-nav-button carousel-nav-right"
                    onClick={scrollRight}
                    disabled={currentIndex === heroes.length - 1}
                    aria-label="Next hero"
                >
                    <IoIosArrowForward />
                </button>
            </div>

            {/* Carousel indicators */}
            <div className="carousel-indicators">
                {heroes.map((_, index) => (
                    <button
                        key={index}
                        className={`carousel-indicator ${index === currentIndex ? 'active' : ''}`}
                        onClick={() => scrollToIndex(index)}
                        aria-label={`Go to slide ${index + 1}`}
                    />
                ))}
            </div>
        </div>
    );
}

