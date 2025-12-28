import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../api/axios";
import lifelink_logo from "../assets/imgs/LogoAdmin.png";
import profile from "../assets/imgs/profile.svg";

export default function Navbar() {
  const { user } = useAuth();
  const navigate = useNavigate();

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
    <nav className="px-6 py-3 flex items-center justify-between relative z-50">
      {/* Logo */}
      <div className="flex items-center gap-2">
          <img src={lifelink_logo} alt="LifeLink Logo" className="h-30 w-auto mt-[-30px] ml-[-10px]" />
      </div>

      {/* Navigation Links */}
      <div className="flex items-center space-x-12 mt-[-30px]">
        <Link to="/home" className="text-gray-800 font-semibold">
          Home
        </Link>
        <Link to="/donation" className="text-white font-semibold hover:text-gray-800 transition-colors duration-200">
          Donate
        </Link>
        <Link to="/play" className="text-white font-semibold hover:text-gray-800 transition-colors duration-200">
          Let's Play
        </Link>
        <Link to="/contact" className="text-white font-semibold hover:text-gray-800 transition-colors duration-200">
          Contact Us
        </Link>

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
            <div className="flex items-center gap-2">
              <img 
                src={profile} 
                alt="Profile" 
                className="w-11 h-11 rounded-full cursor-pointer"
                title={getUserName()}
              />
            </div>
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
