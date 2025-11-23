import React from "react";
import "../styles/OrganDonation.css";

export default function ProgressBar({ goal, raised }) {
  const percentRaised = (raised / goal) * 100;
  const percentLeft = 100 - percentRaised;

  return (
    <div className="progress-wrapper">
      <div className="progress-header">
        <span>Raised: ${raised.toLocaleString()}</span>
        <span>Goal: ${goal.toLocaleString()}</span>
      </div>

      <div className="progress-bar">
        <div
          className="progress-fill"
          style={{ width: `${percentRaised}%` }}
        ></div>
      </div>

      <p className="progress-text">
        {percentLeft.toFixed(2)}% left
      </p>
    </div>
  );
}
