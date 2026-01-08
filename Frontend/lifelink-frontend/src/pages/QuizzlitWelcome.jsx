import Navbar from "../components/Navbar";
import HeroSection from "../components/Quizzlit/HeroSection";
import AboutSection from "../components/Quizzlit/AboutSection";
import QuizSteps from "../components/Quizzlit/QuizSteps";
import TopPlayers from "../components/Quizzlit/TopPlayers";
import Footer from "../components/Footer";

export default function QuizzlitWelcome() {
    return (
        <section className="quizzlit-section">
            <div className="circle-container">
                <div className="circle-red animate-soft-pulse"></div>
                <div className="circle-purple animate-soft-pulse"></div>
                <div className="circle-red circle-bottom-right animate-soft-pulse"></div>
                <div className="circle-purple circle-bottom-right animate-soft-pulse"></div>
            </div>
            <div className="quizzlit-content">
                <Navbar />
                <HeroSection />
                <AboutSection />
                <QuizSteps />
                <TopPlayers />
                <Footer />
            </div>
        </section>
    )
}