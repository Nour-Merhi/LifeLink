import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../api/axios";
import lifelink_logo from "../assets/imgs/Logo.png";
import profile from "../assets/imgs/profile.svg";
import ProfileDropdown from "./ProfileDropdown";
import AdminProfileDropdown from "./adminDashboard/AdminProfileDropdown";
import { useSystemSettings } from "../context/SystemSettingsContext";

export default function Navbar({ handleContactUsClick }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { systemLogo, platformName } = useSystemSettings();

  const handleLogout = async () => {
    try {
      await api.post("/api/logout");
      // Trigger auth change to update context
      window.dispatchEvent(new Event('auth-change'));
      navigate("/home");
    } catch (error) {
      console.error('Logout error:', error);
      // Trigger auth change anyway
      window.dispatchEvent(new Event('auth-change'));
      navigate("/home");
    }
  };

  const handleSignIn = () => {
    navigate("/login");
  };

  const getUserName = () => {
    if (!user) return "";
    const firstName = user.first_name || "";
    const lastName = user.last_name || "";
    return `${firstName} ${lastName}`.trim() || "User";
  };

  return (
    <nav className="px-6 py-4 flex items-center justify-between relative z-50 quiz-navbar">
      {/* Logo */}
      <Link to="/home" className="flex items-center gap-2">
          <img
            src={systemLogo || lifelink_logo}
            alt={`${platformName || "LifeLink"} Logo`}
            className="h-10 w-auto cursor-pointer"
          />
      </Link>

      {/* Navigation Links */}
      <div className="flex items-center space-x-12">
        <NavLink 
          to="/home" 
          className={({ isActive }) => 
            `quiz-nav-link ${isActive ? 'quiz-nav-link-active' : ''}`
          }
        >
          Home
        </NavLink>
        <NavLink 
          to="/donation" 
          className={({ isActive }) => 
            `quiz-nav-link ${isActive ? 'quiz-nav-link-active' : ''}`
          }
        >
          Donate
        </NavLink>
        <NavLink 
          to="/quizlit/welcome" 
          className={({ isActive }) => 
            `quiz-nav-link quiz-nav-link-play ${isActive ? 'quiz-nav-link-play-active' : ''}`
          }
        >
          Let's Play
        </NavLink>
        {handleContactUsClick ? (
          <button
            onClick={handleContactUsClick}
            className="quiz-nav-link"
            style={{ background: 'none', border: 'none', cursor: 'pointer' }}
          >
            Contact Us
          </button>
        ) : (
          <NavLink 
            to="/support"
            className={({ isActive }) => 
              `quiz-nav-link ${isActive ? 'quiz-nav-link-active' : ''}`
            }
          >
            Contact Us
          </NavLink>
        )}

        {/* Authentication Section */}
        {user ? (
          // User is logged in - show logout and profile
          <div className="flex items-center gap-4 ml-16">
            <button
              onClick={handleLogout}
              type="button"
              className="text-[14px] bg-white text-red-600 px-6 py-2 rounded-4xl font-semibold hover:text-black transition-colors duration-200"
            >
              Logout
            </button>
            {user.role?.toLowerCase() === "donor" ? (
              <ProfileDropdown />
            ) : user.role?.toLowerCase() === "admin" ? (
              <AdminProfileDropdown />
            ) : (
            <div className="flex items-center gap-2">
              <img 
                src={profile} 
                alt="Profile" 
                className="w-11 h-11 rounded-full cursor-pointer"
                title={getUserName()}
              />
            </div>
            )}
          </div>
        ) : (
          // User is not logged in - show sign in button
          <button
            onClick={handleSignIn}
            type="button"
            className="text-[14px] bg-black text-white px-6 py-2 ml-30 rounded-4xl font-semibold"
          >
            Sign In
          </button>
        )}
      </div>
    </nav>
  );
}
