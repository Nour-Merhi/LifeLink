import lifelink_logo from "../assets/imgs/lifelink_logo.svg";
import { Link } from "react-router-dom";

export default function Navbar() {
  return (
    <nav className="sticky top-0 z-50 bg-white shadow-lg px-6 py-3 flex items-center justify-between">
      {/* Logo */}
      <div className="flex items-center gap-2">
        <img src={lifelink_logo} alt="LifeLink Logo" className="h-10 w-auto" />
        
      </div>

      {/* Navigation Links */}
      <div className="flex items-center space-x-12">
  <Link to="/" className="text-gray-600 font-semibold hover:text-red-700 transition-colors duration-200">
    Home
  </Link>
  <Link to="/donation" className="text-gray-600 font-semibold hover:text-red-700 transition-colors duration-200">
    Donate
  </Link>
  <Link to="/play" className="text-gray-600 font-semibold hover:text-red-700 transition-colors duration-200">
    Let's Play
  </Link>
  <Link to="/contact" className="text-gray-600 font-semibold hover:text-red-700 transition-colors duration-200">
    Contact Us
  </Link>
  <button
    type="button"
    className="ml-16 bg-gray-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-red-700 transition-colors duration-200"
  >
    Sign In
  </button>
</div>

    </nav>
  );
}
