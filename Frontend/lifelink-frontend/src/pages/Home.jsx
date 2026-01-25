import { useNavigate } from "react-router-dom";
import { useRef, useState } from "react";
import { FaArrowRight, FaRegistered, FaTint } from "react-icons/fa";
import { useAuth } from "../context/AuthContext";

import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import Articles from "../components/home/Articles";
import RegisteredHospitals from "../components/home/RegisteredHospitals";
import QuestionSection from "../components/home/QuestionSection";
import GameSection from "../components/home/GameSection";
import BloodHeroes from "../components/home/BloodHeroes";
import GlobalDonationStats from "../components/home/GlobalDonationStats";
import AnimatedSection from "../components/common/AnimatedSection";

import bloodIllustration from "../assets/illustrations/blood_home.svg";
import humanBodyIllustration from "../assets/imgs/HumanBodySvg/HumanBody.svg";
import AiIcon from "../assets/imgs/aiIcon.svg";
import "../styles/HumanBodySection.css";
import "../styles/HomeStats.css";
import "../styles/Chatbot.css";
import "../styles/animation.css";

export default function Home() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const footerRef = useRef(null);
  const [isChatbotOpen, setIsChatbotOpen] = useState(false);

  const handleHumanBodyClick = () => {
    navigate("/human-body");
  };

  const handleContactUsClick = () => {
    footerRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  if (loading) return null;

  // 🔹 Navigation logic without backend calls
  const handleSaveLifeClick = () => {
    navigate(user ? "/donation/alive-organ-donation" : "/donation");
  };

  const handleDonateBloodClick = () => {
    navigate(user ? "/donation/hospital-blood-donation" : "/donation");
  };

  const handleScheduleClick = () => {
    navigate("/donation");
  };
   const openChatbot = () => {
    setIsChatbotOpen(true);
    navigate('/chatbot');
   }

  return (
    <>
      {/*================== Chatbot Widget ================ */}
      <div className="chatbot-widget animate-slow-pulse" role="button" onClick={openChatbot}>
        <img src={AiIcon} alt="AI Icon" width="35px" height="35px"/>
      </div>


      {/* ================= HERO SECTION ================= */}
      <AnimatedSection id="hero" className="relative overflow-hidden hero-section" animation="fade-in">
        <Navbar handleContactUsClick={handleContactUsClick} />

        <div className="wave-illustartion">
          <svg
            className="wave"
            viewBox="0 0 1082 802"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M0.5 0C0.499736 164 53.5 318 168.501 401C283.501 484 511.501 501.5 633.5 452C753.467 403.325 747 704 811.5 755.5C868.312 800.862 976.5 811.5 1082 792V0H382.924H0.5Z"
              fill="#F12C31"
            />
          </svg>
        </div>

        <div className="hero-content">
          <div id="text-img">
            <div className="hero-info">
              <h1>BE THE</h1>
              <h1>LINK THAT SAVES A LIFE</h1>
              <p>
                Join LifeLink in connecting donors, hospitals and patients to save
                lives through blood, organ, and financial donations
              </p>
              <div className="flex gap-4 mt-5">
                <button
                  onClick={handleSaveLifeClick}
                  className="flex items-center gap-2 bg-red-500 text-white px-6 py-3 rounded-full font-semibold hover:bg-red-700 transition"
                >
                  {user ? "Save Life" : "Start Saving Life"} <FaArrowRight />
                </button>

                <button
                  onClick={handleDonateBloodClick}
                  className="flex items-center gap-2 bg-red-100 text-red-600 px-6 py-3 rounded-full font-semibold hover:bg-red-200 transition"
                >
                  {user ? "Donate Blood" : "Start Donating Blood"} <FaTint />
                </button>
              </div>
            </div>
          </div>

          <div className="first-illustration">
            <img
              src={bloodIllustration}
              alt="illustration for blood donation"
            />
          </div>
        </div>
      </AnimatedSection>

      {/*=================GLOBAL STATS ================= */}
      <AnimatedSection animation="fade-up">
        <GlobalDonationStats />
      </AnimatedSection>

      {/*==================Humamn Body Section ================= */}
      <AnimatedSection className="mt-12" animation="fade-up">
        {/* ================= DISCOVER THE HUMAN BODY ================= */}
        <div className="flex flex-row items-center justify-around px-10 py-20 mx-auto human-container">
          <div className="flex flex-col max-w-2xl">
            <span className="text-gray-400 mb-8 text-left">Explore</span>
            <h2 className="text-5xl font-extrabold text-left text-gray-900 !mb-5">
              Discover the Human Body <br /> Like Never Before
            </h2>
            <p className="text-gray-600 mb-10 text-left"> Dive into our interactive human body feature that brings anatomy to life.<br/> Learn how your donations can make a real difference in saving lives.</p>
            
            <div className="flex gap-2">
              <button onClick={handleHumanBodyClick} className="bg-red-500 text-white px-5 py-2 rounded hover:bg-red-700 transition flex items-center gap-2">
                Start
              </button>
              <button className="text-gray-700 px-5 py-2 rounded transition flex items-center gap-2">
                Learn More
                <FaArrowRight />
              </button>
            </div>
          </div>

          {/* Human Body Illustration */}
          <div className="flex-shrink-0 w-full md:w-auto">
              <div className="human-body-container">
                <img 
                  src={humanBodyIllustration} 
                  alt="Human body anatomy illustration" 
                  className="human-body-image"
                />
              </div>
          </div>
        </div>
      </AnimatedSection>

      {/*=================TOP Blood Donors ================= */}
      <section className="mt-12">
        <div className="text-center">
          <h2 className="text-[34px] font-extrabold  mb-2">
            Top Blood Donors
          </h2>
          <p className="max-w-3xl mx-auto text-gray-600 text-sm">
            Honoring our lifesaving champions who make a difference through their generous donations
          </p>
        </div>
        <BloodHeroes />
        <div className="bg-gradient-to-r from-red-900 to-red-700 text-white rounded-[18px] p-8 max-w-[760px] text-center my-10 mx-5 md:mx-auto ">
          <h3 className="font-semibold text-2xl mb-2">Join our Heroes</h3>
          <p className="mb-6 text-[16px]">
            Every donation can save up to 3 lives. Be the hero someone needs
            today.
          </p>
          <button
            onClick={handleScheduleClick}
            className="bg-white text-red-600 text-[14px] font-semibold rounded-full px-6 py-2 hover:bg-red-100 transition"
          >
            Schedule your Donation
          </button>
        </div>
      </section>

      {/* ================= ARTICLES ================= */}
      <AnimatedSection className="mt-12" animation="fade-up">
        <Articles />
      </AnimatedSection>

      {/* ================= QUESTION SECTION ================= */}
      <QuestionSection />

      {/* ================= GAME SECTION ================= */}
      <GameSection />

      <div className="bg-linear-to-r from-black to-gray-900 ">
        {/* =============== Hospital Section ================= */}
        <RegisteredHospitals />

        {/* ================= FOOTER ================= */}
        <Footer ref={footerRef} />
      </div>
    </>
  );
}
