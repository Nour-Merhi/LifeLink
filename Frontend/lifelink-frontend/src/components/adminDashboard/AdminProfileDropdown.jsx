import { useState, useRef, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import "../../styles/ProfileDropdown.css";
import { IoPerson, IoSettings } from "react-icons/io5";
import { FiLogOut } from "react-icons/fi";
import profile from "../../assets/imgs/profile.svg";
import api from "../../api/axios";

const API_BASE_URL = "http://localhost:8000";

export default function AdminProfileDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();
  const { user } = useAuth();
  

  const profileImageSrc = useMemo(() => {
    if (!user?.profile_picture) {
      return profile;
    }
    
    // If it's already a full URL (starts with http), use it as is
    if (user.profile_picture.startsWith('http')) {
      return user.profile_picture;
    }
    
    // If it's a relative path, construct the full URL
    return `${API_BASE_URL}/${user.profile_picture}`;
  }, [user?.profile_picture]);

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
      label: "Settings",
      icon: <IoSettings />,
      path: "/admin/settings",
    },
  ];

  const handleMenuItemClick = (path) => {
    navigate(path);
    setIsOpen(false);
  };

  const handleLogout = async () => {
    try {
      await api.post("/api/logout");
      window.dispatchEvent(new Event('auth-change'));
      navigate("/home");
      setIsOpen(false);
    } catch (error) {
      // Still navigate to home even if logout fails
      window.dispatchEvent(new Event('auth-change'));
      navigate("/home");
      setIsOpen(false);
    }
  };

  // Only show dropdown for admins (case-insensitive check)
  if (!user || user.role?.toLowerCase() !== "admin") {
    return null;
  }
  

  return (
    <div className="profile-dropdown-container" ref={dropdownRef}>
      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsOpen(prev => {
            return !prev;
          });
        }}
        className="profile-dropdown-trigger"
        aria-label="Profile menu"
        type="button"
        style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', position: 'relative', zIndex: 1 }}
      >
        <img 
          src={profileImageSrc} 
          alt="Profile" 
          width="40px"
          height="40px"
          style={{ borderRadius: '50%', objectFit: 'cover', pointerEvents: 'none' }}
          onError={(e) => {
            // Fallback to default profile image if image fails to load
            e.target.src = profile;
          }}
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
            <button
              onClick={handleLogout}
              className="profile-dropdown-item"
              type="button"
            >
              <span className="profile-dropdown-icon"><FiLogOut /></span>
              <span className="profile-dropdown-label">Logout</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

