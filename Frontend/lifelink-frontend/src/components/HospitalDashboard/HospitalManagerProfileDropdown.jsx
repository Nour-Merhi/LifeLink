import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import "../../styles/ProfileDropdown.css";
import {
  IoAnalytics,
  IoCalendar,
  IoNotifications,
  IoPeople,
  IoSettings,
  IoWarning,
} from "react-icons/io5";
import profile from "../../assets/imgs/profile.svg";
import { getApiBaseUrl } from "../../config/api";

const API_BASE_URL = getApiBaseUrl();

export default function HospitalManagerProfileDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();
  const { user } = useAuth();

  const profileImageSrc = useMemo(() => {
    if (!user?.profile_picture) return profile;
    if (typeof user.profile_picture === "string" && user.profile_picture.startsWith("http")) {
      return user.profile_picture;
    }
    return `${API_BASE_URL}/${user.profile_picture}`;
  }, [user?.profile_picture]);

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

  // Only show dropdown for hospital managers (case-insensitive check)
  if (!user || user.role?.toLowerCase() !== "manager") {
    return null;
  }

  const menuItems = [
    { label: "Analytics", icon: <IoAnalytics />, path: "/hospital/analytics" },
    { label: "Appointments", icon: <IoCalendar />, path: "/hospital/appointments" },
    { label: "Urgent Requests", icon: <IoWarning />, path: "/hospital/urgent-requests" },
    { label: "Donors", icon: <IoPeople />, path: "/hospital/donors" },
    { label: "Notifications", icon: <IoNotifications />, path: "/hospital/notifications" },
    { label: "Settings", icon: <IoSettings />, path: "/hospital/settings" },
  ];

  const handleMenuItemClick = (path) => {
    navigate(path);
    setIsOpen(false);
  };

  return (
    <div className="profile-dropdown-container" ref={dropdownRef}>
      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsOpen((prev) => !prev);
        }}
        className="profile-dropdown-trigger"
        aria-label="Profile menu"
        type="button"
        style={{ background: "none", border: "none", padding: 0, cursor: "pointer", position: "relative", zIndex: 1 }}
        title="Hospital Manager Menu"
      >
        <img
          src={profileImageSrc}
          alt="Profile"
          width="40px"
          height="40px"
          style={{ borderRadius: "50%", objectFit: "cover", pointerEvents: "none" }}
          onError={(e) => {
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
          </div>
        </div>
      )}
    </div>
  );
}

