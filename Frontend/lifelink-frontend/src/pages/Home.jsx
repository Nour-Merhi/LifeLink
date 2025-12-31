import { useNavigate } from "react-router-dom";
import { FaArrowRight, FaRegistered, FaTint } from "react-icons/fa";

import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import BloodHeroes from "../components/home/BloodHeroes";
import Articles from "../components/home/Articles";
import RegisteredHospitals from "../components/home/RegisteredHospitals";
import { useAuth } from "../context/AuthContext";
import QuestionSection from "../components/home/QuestionSection";
import GameSection from "../components/home/GameSection";
import SuperheroesCarousel from "../components/home/SuperheroesCarousel";
import BackgroundWave from "../assets/imgs/wave/Background_game_wave.svg";

import bloodIllustration from "../assets/illustrations/blood_home.svg";
import humanBodyIllustration from "../assets/imgs/HumanBody/HumanBody.svg";
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

  const heroes = [
    { id: 1, name: "John & Evan", imgSrc: "/donationHistory.jpg", link: "/hero1", type: "Kidney Donator" },
    { id: 2, name: "Jane & Mike", imgSrc: "/donationHistory.jpg", link: "/hero2", type: "Blood Donator" },
    { id: 3, name: "Sara & Ben", imgSrc: "/donationHistory.jpg", link: "/hero3", type: "Organ Donator" },
    { id: 4, name: "Lisa & Tom", imgSrc: "/donationHistory.jpg", link: "/hero4", type: "Blood Donator" },
    { id: 5, name: "Anna & Jack", imgSrc: "/donationHistory.jpg", link: "/hero5", type: "Kidney Donator" },
    { id: 6, name: "Mona & Paul", imgSrc: "/donationHistory.jpg", link: "/hero6", type: "Organ Donator" },
  ];

  return (
    <>
      <Navbar />

      {/* ================= HERO SECTION ================= */}
      <section id="hero">
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
            Save Life <FaArrowRight />
          </button>

          <button
            onClick={handleDonateBloodClick}
            className="flex items-center gap-2 bg-red-100 text-red-600 px-6 py-3 rounded-full font-semibold hover:bg-red-200 transition"
          >
            Donate Blood <FaTint />
          </button>
        </div>
      </section>

      {/* ================= HEROES SECTION ================= */}
      <section className="mt-32 text-center px-6">
        <h2 className="text-4xl font-bold text-gray-800 mb-2">
          Blood Donors Heroes
        </h2>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Honoring our lifesaving champions who make a difference through their
          generous donations
        </p>

        <BloodHeroes />

        <div className="bg-gradient-to-r from-red-900 to-red-700 text-white rounded-2xl p-8 max-w-[760px] mx-auto text-center my-10">
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

        {/* ================= DISCOVER THE HUMAN BODY ================= */}
        <div className="flex flex-col md:flex-row items-center px-10 py-20 mt-20 mx-auto gap-20">
          <div className="flex flex-col max-w-2xl ml-10">
            <span className="text-gray-400 mb-8 text-left">Explore</span>
            <h2 className="text-5xl font-extrabold text-left text-gray-900 mb-2">
              Discover the Human Body <br /> Like Never Before
            </h2>
            <p className="text-gray-600 mb-10 text-left">
              Dive into our interactive human body feature that brings anatomy
              to life. Learn how your donations can make a real difference in
              saving lives.
            </p>

            <div className="flex gap-4">
              <button
                onClick={() => navigate("/humanbody")}
                className="bg-gradient-to-r from-red-700 to-red-600 text-white px-5 py-2 rounded hover:bg-red-600 transition"
              >
                Start
              </button>
              <button className="bg-gray-200 text-gray-700 px-5 py-2 rounded hover:bg-gray-300 transition flex items-center gap-2">
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
      </section>

      {/* ================= ARTICLES ================= */}
      <section className="mt-12">
        <Articles />
      </section>

      {/* ================= SUPERHEROES ================= */}
      <div className="mt-14">
        <h2 className="text-center text-4xl font-bold mb-6">
          Meet Our Superheroes <br /> & Discover Their Stories
        </h2>

        <SuperheroesCarousel heroes={heroes} />
      </div>

      {/* ================= QUESTION SECTION ================= */}
      <QuestionSection />

      {/* ================= GAME SECTION ================= */}
      <GameSection />

      <div className="bg-linear-to-r from-black to-gray-900">
      {/* =============== Hospital Section ================= */}
      <RegisteredHospitals />


      {/* ================= FOOTER ================= */}
      <Footer />
      </div>
    </>
  );
}
