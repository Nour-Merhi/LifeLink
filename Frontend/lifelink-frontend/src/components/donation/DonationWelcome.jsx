import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../../styles/OrganDonation.css";

export default function DonationWelcome() {
  const [active, setActive] = useState("signin");
  const navigate  = useNavigate();

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
            () => navigate ("/signin-page")
          }
        >
          Signin
        </button>
        <button
          className={`btn login ${active === "login" ? "active" : ""}`}
          onMouseEnter={() => setActive("login")}
          onClick = {
            () => navigate ("/login-page")
          }
        >
          Login
        </button>
      </div>
    </div>
  );
}
