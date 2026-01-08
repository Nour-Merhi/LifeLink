import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "../styles/ProfileDropdown.css";
import { IoPerson, IoCalendar, IoHeart, IoGift, IoSettings } from "react-icons/io5";
import profile from "../assets/imgs/profile.svg";

export default function ProfileDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // Get profile picture or fallback to default
  const profileImageSrc = user?.profile_picture || profile;

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const menuItems = [
    {
      label: "Profile",
      icon: <IoPerson />,
      path: "/donor/home",
    },
    {
      label: "My Appointments",
      icon: <IoCalendar />,
      path: "/donor/my-appointments",
    },
    {
      label: "My Donations",
      icon: <IoHeart />,
      path: "/donor/my-donations",
    },
    {
      label: "Rewards",
      icon: <IoGift />,
      path: "/donor/rewards",
    },
    {
      label: "Settings",
      icon: <IoSettings />,
      path: "/donor/settings",
    },
  ];

  const handleMenuItemClick = (path) => {
    navigate(path);
    setIsOpen(false);
  };

  // Only show dropdown for donors (case-insensitive check)
  if (!user || user.role?.toLowerCase() !== "donor") {
    return null;
  }

  return (
    <div className="profile-dropdown-container" ref={dropdownRef}>
      <button
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        className="profile-dropdown-trigger"
        aria-label="Profile menu"
        type="button"
      >
        <img 
          src={profileImageSrc} 
          alt="Profile" 
          className="w-11 h-11 rounded-full cursor-pointer object-cover"
        />
      </button>

      {isOpen && (
        <div className="profile-dropdown-menu">
          <div className="profile-dropdown-divider"></div>
          <div className="profile-dropdown-items">
            {menuItems.map((item, index) => (
              <button
                key={index}
                onClick={() => handleMenuItemClick(item.path)}
                className="profile-dropdown-item"
                type="button"
              >
                <span className="profile-dropdown-icon">{item.icon}</span>
                <span className="profile-dropdown-label">{item.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

