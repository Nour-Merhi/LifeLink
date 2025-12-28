import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../../styles/OrganDonation.css";
import { useAuth } from "../../context/AuthContext";

export default function DonationWelcome() {
  const [active, setActive] = useState("signin");
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  const getUserName = () => {
    if (!user) return "";
    const firstName = user.first_name || "";
    const lastName = user.last_name || "";
    return `${firstName} ${lastName}`.trim() || "Donor";
  };

  if (loading) {
    return (
      <div className="auth-container">
        <p>Loading...</p>
      </div>
    );
  }

  if (user) {
    return (
      <div className="auth-container">
        <h2>Welcome {getUserName()}!</h2>
        <p>Kindly choose your donation type</p>
      </div>
    );
  }

  return (
    <div className="auth-container">
      <h2>Welcome!</h2>
      <p>You must be logged in to be able to continue</p>

      <div
        className="auth-toggle"
        onMouseLeave={() => setActive("signin")} // optional: default back
      >
        <span className={`highlight ${active}`} />
        <button
          className={`btn signin ${active === "signin" ? "active" : ""}`}
          onMouseEnter={() => setActive("signin")}
          onClick = {
            () => navigate ("/register")
          }
        >
          Signin
        </button>
        <button
          className={`btn login ${active === "login" ? "active" : ""}`}
          onMouseEnter={() => setActive("login")}
          onClick = {
            () => navigate ("/login")
          }
        >
          Login
        </button>
      </div>
    </div>
  );
}
