import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../api/axios";
import lifelink_logo from "../assets/imgs/Logo.png";
import profile from "../assets/imgs/profile.svg";
import ProfileDropdown from "./ProfileDropdown";
import AdminProfileDropdown from "./adminDashboard/AdminProfileDropdown";
import HospitalManagerProfileDropdown from "./HospitalDashboard/HospitalManagerProfileDropdown";
import { useSystemSettings } from "../context/SystemSettingsContext";
import { useEffect, useState } from "react";
import { IoClose, IoMenu } from "react-icons/io5";

export default function Navbar({ handleContactUsClick }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { systemLogo, platformName } = useSystemSettings();
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    // Close mobile menu when navigating
    setMobileOpen(false);
  }, [location.pathname]);

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

  const NavItems = ({ isMobile = false }) => (
    <>
      <NavLink
        to="/home"
        className={({ isActive }) =>
          `quiz-nav-link ${isMobile ? "quiz-nav-link-mobile" : ""} ${isActive ? "quiz-nav-link-active" : ""}`
        }
        onClick={() => isMobile && setMobileOpen(false)}
      >
        Home
      </NavLink>
      <NavLink
        to="/donation"
        className={({ isActive }) =>
          `quiz-nav-link ${isMobile ? "quiz-nav-link-mobile" : ""} ${isActive ? "quiz-nav-link-active" : ""}`
        }
        onClick={() => isMobile && setMobileOpen(false)}
      >
        Donate
      </NavLink>
      
      <NavLink
        to="/quizlit/welcome"
        className={({ isActive }) =>
          `quiz-nav-link ${isMobile ? "quiz-nav-link-mobile" : ""} quiz-nav-link-play ${
            isActive ? "quiz-nav-link-play-active" : ""
          }`
        }
        onClick={() => isMobile && setMobileOpen(false)}
      >
        Let&apos;s Play
      </NavLink>

      <NavLink 
      to="/rewards"
      className={({ isActive }) =>
        `quiz-nav-link ${isMobile ? "quiz-nav-link-mobile" : ""} quiz-nav-link-play 
      ${isActive ? "quiz-nav-link-play-active" : ""}`
      }

      onClick={() => isMobile && setMobileOpen(false)}
      >
        Rewards
      </NavLink>

      {handleContactUsClick ? (
        <button
          onClick={() => {
            handleContactUsClick();
            if (isMobile) setMobileOpen(false);
          }}
          className={`quiz-nav-link quiz-nav-button ${isMobile ? "quiz-nav-link-mobile" : ""}`}
          type="button"
        >
          Contact Us
        </button>
      ) : (
        <NavLink
          to="/support"
          className={({ isActive }) =>
            `quiz-nav-link ${isMobile ? "quiz-nav-link-mobile" : ""} ${isActive ? "quiz-nav-link-active" : ""}`
          }
          onClick={() => isMobile && setMobileOpen(false)}
        >
          Contact Us
        </NavLink>
      )}
    </>
  );

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

      {/* Desktop Navigation */}
      <div className="hidden md:flex items-center space-x-12">
        <NavItems />

        {/* Authentication Section (desktop) */}
        {user ? (
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
            ) : user.role?.toLowerCase() === "manager" ? (
              <HospitalManagerProfileDropdown />
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
          <button
            onClick={handleSignIn}
            type="button"
            className="text-[14px] bg-black text-white px-6 py-2 ml-30 rounded-4xl font-semibold"
          >
            Sign In
          </button>
        )}
      </div>

      {/* Mobile menu button */}
      <button
        type="button"
        className="md:hidden inline-flex items-center justify-center w-10 h-10 rounded-lg bg-white/20 backdrop-blur-sm"
        onClick={() => setMobileOpen((v) => !v)}
        aria-label={mobileOpen ? "Close menu" : "Open menu"}
      >
        {mobileOpen ? <IoClose size={22} /> : <IoMenu size={22} />}
      </button>

      {/* Mobile menu */}
      {mobileOpen ? (
        <div className="md:hidden absolute top-full left-1/2 right-0 mt-2 mx-3 rounded-xl bg-white text-black shadow-lg border border-black/10 overflow-hidden">
          <div className="flex flex-col gap-3 p-4">
            <NavItems isMobile />

            <div className="h-px bg-black/10 my-1" />

            {user ? (
              <>
                <button
                  onClick={handleLogout}
                  type="button"
                  className="w-full text-[14px] bg-black text-white px-4 py-2 rounded-lg font-semibold"
                >
                  Logout
                </button>
                {/* Keep dropdowns desktop-only; on mobile show a simple profile entry */}
                <button
                  type="button"
                  className="w-full text-left text-[14px] bg-gray-100 text-black px-4 py-2 rounded-lg font-semibold"
                  onClick={() => {
                    setMobileOpen(false);
                    const role = user?.role?.toLowerCase();
                    if (role === "admin") navigate("/admin");
                    else if (role === "manager") navigate("/hospital");
                    else if (role === "donor") navigate("/donor");
                  }}
                >
                  {getUserName()}
                </button>
              </>
            ) : (
              <button
                onClick={handleSignIn}
                type="button"
                className="w-full text-[14px] bg-black text-white px-4 py-2 rounded-lg font-semibold"
              >
                Sign In
              </button>
            )}
          </div>
        </div>
      ) : null}
    </nav>
  );
}
