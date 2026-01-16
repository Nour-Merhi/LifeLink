import Navbar from "../components/Navbar";
import HeroSection from "../components/Quizzlit/HeroSection";
import AboutSection from "../components/Quizzlit/AboutSection";
import QuizSteps from "../components/Quizzlit/QuizSteps";
import TopPlayers from "../components/Quizzlit/TopPlayers";
import Footer from "../components/Footer";

import { useRef } from "react";

export default function QuizzlitWelcome() {
    const topPlayersRef = useRef(null);
    const footerRef = useRef(null);

    const handleTopPlayersClick = () => {
        topPlayersRef.current.scrollIntoView({ behavior: "smooth" });
    }
    const handleContactUsClick = () => {
        footerRef.current.scrollIntoView({ behavior: "smooth" });
    }

    return (
        <section className="quizzlit-section">
            <div className="circle-container">
                <div className="circle-red animate-soft-pulse"></div>
                <div className="circle-purple animate-soft-pulse"></div>
                <div className="circle-red circle-bottom-right animate-soft-pulse"></div>
                <div className="circle-purple circle-bottom-right animate-soft-pulse"></div>
            </div>
            <div className="quizzlit-content">
                <Navbar handleContactUsClick={handleContactUsClick}/>
                <HeroSection handleTopPlayersClick={handleTopPlayersClick} />
                <AboutSection />
                <QuizSteps />
                <TopPlayers ref={topPlayersRef} />
                <Footer  ref={footerRef}/>
            </div>
        </section>
    )
}