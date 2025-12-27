import Navbar from "../components/Navbar"
import bloodIllustration from "../assets/illustrations/blood_home.svg"
import { FaArrowRight, FaTint } from "react-icons/fa"
import BloodHeroes from "../components/home/BloodHeroes";
import { useNavigate } from "react-router-dom"; 
import Articles from "../components/home/Articles"
//import Historydonor from "../components/home/donationHistory"

export default function Home(){
  const stats = [
  { label: "Total Donations" },
  { label: "Active Donors" },
  { label: "Lives Saved" },
];
const heroes = [
  { id: 1, name: "John & Evan", role: "Kidney Donor", imgSrc: "/donationHistory.jpg", link: "/hero1" },
  { id: 2, name: "Jane & Mike", role: "Blood Donor", imgSrc: "/donationHistory.jpg", link: "/hero2" },
  { id: 3, name: "Sara & Ben", role: "Liver Donor", imgSrc: "/donationHistory.jpg", link: "/hero3" },
  { id: 4, name: "Lisa & Tom", role: "Plasma Donor", imgSrc: "/donationHistory.jpg", link: "/hero4" },
  { id: 5, name: "Anna & Jack", role: "Organ Recipient", imgSrc: "/donationHistory.jpg", link: "/hero5" },
  { id: 6, name: "Mona & Paul", role: "Bone Marrow Donor", imgSrc: "/donationHistory.jpg", link: "/hero6" },
];
const navigate = useNavigate();

  const handleScheduleClick = () => {
    navigate("/donation"); // Adjust path to your donation page route
  };
    return (
        <>
        <Navbar />
        <section id="hero">
            <div id="text-img">
              <h1>hello</h1>
                <div className="hero-info pl-10">
                    <h1> BE THE </h1>
                    <h1> LINK THAT SAVES A LIFE</h1>
                    <p>  Join LifeLink in connecting donors, hospitals and patients to save lives through blood, organ, and financial donations</p>
                </div>
                <div className="first-illustration">
                    <img src={bloodIllustration} alt=" illustration for blood donation" />
                </div>
            </div>

            <div className="wave-illustartion">
                <svg className="wave"
                    viewBox="0 0 1082 802" 
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg">
                    <path d="M0.5 0C0.499736 164 53.5 318 168.501 401C283.501 484 511.501 501.5 633.5 452C753.467 403.325 747 704 811.5 755.5C868.312 800.862 976.5 811.5 1082 792V0H382.924H0.5Z" fill="#F12C31"/>
                </svg>
            </div>

            <div className="flex gap-4 pl-25 mt-12">
              <button className="flex items-center gap-2 bg-red-700 text-white px-6 py-3 rounded-full font-semibold shadow-md hover:bg-red-700 transition"
              onClick={() => navigate("/donation")}>
                Save Life <FaArrowRight />
              </button>

              <button className="flex items-center gap-2 bg-red-100 text-red-600 px-6 py-3 rounded-full font-semibold shadow-md hover:bg-red-200 transition"
              onClick={() => navigate("/donation")}>
                Donate Blood <FaTint />
              </button>
            </div>
            
        </section>
        <section className="mt-32 text-center px-6">
      {/* Title */}
      <h2 className="text-3xl font-bold text-gray-800 mb-2">
        Blood Donors Heroes
      </h2>
      <p className="text-gray-600 mb-10">
        Honoring our lifesaving champions who make a difference through their
        generous donations
      </p>
     
       

       
     <BloodHeroes/>
<div className="bg-gradient-to-r from-red-900 to-red-700 text-white rounded-xl p-8 max-w-3xl mx-auto text-center my-12">
      <h3 className="font-semibold text-lg mb-2">Join our Heroes</h3>
      <p className="mb-6 text-sm">
        Every donation can save up to 3 lives. Be the hero someone needs today.
      </p>
      <button
        onClick={handleScheduleClick}
        className="bg-white text-red-600 font-semibold rounded-full px-6 py-2 hover:bg-red-100 transition"
      >
        Schedule your Donation
      </button>
    </div>     
    
    <div className="flex flex-col md:flex-row items-center justify-between bg-white px-8 py-16 mt-12 mx-auto max-w-6xl shadow rounded-lg">
      <div className="flex flex-col max-w-xl">
        <span className="text-left text-gray-400 mb-2">Explore</span>
        <h2 className="text-3xl font-extrabold text-left text-gray-800 mb-4 leading-snug">
          Discover the Human Body<br />Like Never Before
        </h2>
        <p className="text-gray-600 mb-8">
          Dive into our interactive human body feature that brings anatomy to life.<br />
          Learn how your donations can make a real difference in saving lives.
        </p>
        <div className="flex gap-4">
          <button
            className="bg-gradient-to-r from-red-700 to-red-600 text-white px-5 py-2 rounded hover:bg-red-600 transition"
            onClick={() => navigate("/humanbody")}
          >
            Start
          </button>
          <button className="bg-gray-200 text-gray-700 px-5 py-2 rounded hover:bg-gray-300 transition">
            Learn More
          </button>
        </div>
      </div>
     
    </div>
 
<section className="mt-12"> 
       <Articles/>
        
</section>

<div className="mt-14">
      <h2 className="text-center text-xl font-semibold mb-6">
        Meet Our Superheroes<br />& Discover Their Stories
      </h2>
      <div className="flex overflow-x-auto space-x-8 px-4 scrollbar-hide">
        {heroes.map(({ id, imgSrc, link, name }) => (
          <div
            key={id}
            onClick={() => navigate(link)}
            className="flex-shrink-0 cursor-pointer rounded-lg shadow-lg overflow-hidden"
            style={{ width: "180px", height: "180px" }}
          >
            <img
              src={imgSrc}
              alt={name}
              className="w-full h-full object-cover rounded-lg"
            />
          </div>
        ))}
      </div>
    </div>
      
    </section>
        </>
    )
}