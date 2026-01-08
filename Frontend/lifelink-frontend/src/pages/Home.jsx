import { useNavigate } from "react-router-dom";
import { FaArrowRight, FaRegistered, FaTint } from "react-icons/fa";
import { useAuth } from "../context/AuthContext";

import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import Articles from "../components/home/Articles";
import RegisteredHospitals from "../components/home/RegisteredHospitals";
import QuestionSection from "../components/home/QuestionSection";
import GameSection from "../components/home/GameSection";

import bloodIllustration from "../assets/illustrations/blood_home.svg";
import "../styles/HumanBodySection.css";

export default function Home() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

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

  return (
    <>
      {/* ================= HERO SECTION ================= */}
      <section id="hero" className="min-h-screen">
      <Navbar />
        <div id="text-img">
          <div className="hero-info">
            <h1>BE THE</h1>
            <h1>LINK THAT SAVES A LIFE</h1>
            <p>
              Join LifeLink in connecting donors, hospitals and patients to save
              lives through blood, organ, and financial donations
            </p>
          </div>

          <div className="first-illustration">
            <img
      
              src={bloodIllustration}
              alt="illustration for blood donation"
            />
          </div>
        </div>

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

        <div className="flex gap-4 pl-19 mt-5">
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
      </section>


      {/* ================= ARTICLES ================= */}
      <section className="mt-12 min-h-screen">
        <Articles />
      </section>

      {/* ================= QUESTION SECTION ================= */}
      <QuestionSection  />

      {/* ================= GAME SECTION ================= */}
      <GameSection  />

      <div className="bg-linear-to-r from-black to-gray-900 min-h-screen">
      {/* =============== Hospital Section ================= */}
      <RegisteredHospitals  />

      {/* ================= FOOTER ================= */}
      <Footer />
      </div>
    </>
  );
}
