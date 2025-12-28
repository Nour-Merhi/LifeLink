import { NavLink, useNavigate } from "react-router-dom";
import lifelinklogo from "../../assets/imgs/Logo.png";
import "../../styles/sidebar.css";
import { useAuth } from "../../context/AuthContext";

import { FaHouseChimney } from "react-icons/fa6";
import { FaHospital } from "react-icons/fa";
import { PiHeartbeatFill } from "react-icons/pi";
import { MdHealthAndSafety } from "react-icons/md";
import { RiHandHeartFill } from "react-icons/ri";
import { BiHomeSmile } from "react-icons/bi";

export default function Sidebar() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleDonationClick = (e) => {
    if (!user) {
      e.preventDefault();
      navigate("/donation");
    }
  };

  return (

    <div className="sidebar pl-3 pr-3">
      <div className="top">
        <img src={lifelinklogo} alt="life link logo" />
        <h1>Donation Center</h1>
        <p>Choose your donation type</p>
      </div>
      <hr />

      <div className="donation">
        <h2>BLOOD DONATION</h2>

        <NavLink 
          to="home-blood-donation" 
          onClick={handleDonationClick}
          className={({ isActive }) =>
            `option rounded-[15px] ${!user ? "disabled-option" : "hover:bg-gray-300"} ${isActive ? "bg-gradient-to-r from-red-600 to-red-800 text-white" : "text-black"}`
          }   
        >
  
          {({ isActive }) => (
            <>
              <div className={`icon ${isActive ? "bg-red-500" : "bg-gray-200"}`}>
                <FaHouseChimney />
              </div>
              <div>
                <h3>Home Donation</h3>
                <p>Mobile blood donation services at your location</p>
              </div>
            </>
          )}
        </NavLink>



        <NavLink to="hospital-blood-donation"
        onClick={handleDonationClick}
        className={({ isActive }) =>
            `option rounded-[15px] ${!user ? "disabled-option" : "hover:bg-gray-300"} 
            ${isActive ? 
              "bg-gradient-to-r from-red-600 to-red-800 text-white " : 
              ""}`
            } >
          {({ isActive }) => (
            <>
              <div className={`icon ${isActive ? "bg-red-500" : "bg-gray-200"}`}>
                <FaHospital />
              </div>
              <div>
                <h3>Hospital Donation</h3>
                <p>Visit our donation centers and hospitals</p>
              </div>
           </>
          )}
        </NavLink>
      </div>

      <div className="donation">
        <h2>ORGAN DONATION</h2>

        <NavLink to="/donation/alive-organ-donation"
        onClick={handleDonationClick}
         className={({ isActive }) =>
            `option rounded-[15px] ${!user ? "disabled-option" : "hover:bg-gray-300"} 
            ${isActive ? 
              "bg-gradient-to-r from-red-600 to-red-800 text-white " : 
              ""}`
            } >
          {({ isActive }) => (
            <>
              <div className={`icon ${isActive ? "bg-red-500" : "bg-gray-200"}`}>
                <PiHeartbeatFill />
              </div>
              <div>
                <h3>Living Donor</h3>
                <p>Living organ donation registration</p>
              </div>
            </>
          )}
        </NavLink>

        <NavLink to="/donation/after-death-donation"
        onClick={handleDonationClick}
          className={({ isActive }) =>
            `option rounded-[15px] ${!user ? "disabled-option" : "hover:bg-gray-300"} 
            ${isActive ? 
              "bg-gradient-to-r from-red-600 to-red-800 text-white " : 
              ""}`
            } >
          {({ isActive }) => (
            <>
              <div className={`icon ${isActive ? "bg-red-500" : "bg-gray-200"}`}>
                <MdHealthAndSafety />
              </div>
              <div>
                <h3>After Death</h3>
                <p>Posthumous organ donation pledge</p>
              </div>
            </>
          )}
        </NavLink>
      </div>

      <div className="donation">
        <h2>FINANCIAL SUPPORT</h2>

        <NavLink to="/donation/financial-support"
        onClick={handleDonationClick}
          className={({ isActive }) =>
            `option rounded-[15px] ${!user ? "disabled-option" : "hover:bg-gray-300"} 
            ${isActive ? 
              "bg-gradient-to-r from-red-600 to-red-800 text-white " : 
              ""}`
        }>
          {({ isActive }) => (
            <>
              <div className={`icon ${isActive ? "bg-red-500" : "bg-gray-200"}`}>
                <RiHandHeartFill />
              </div>
              <div>
                <h3>Surgical Donation</h3>
                <p>Support surgical procedures financially</p>
              </div>
              </>
          )}
        </NavLink>
      </div>

      <hr id="bottom-hr" />
      <NavLink to="/home" id="home" className="option">
        <div id="home-icon" className="icon">
          <BiHomeSmile />
        </div>
        <div>
          <h3>Back Home</h3>
        </div>
      </NavLink>
    </div>
  );
}
