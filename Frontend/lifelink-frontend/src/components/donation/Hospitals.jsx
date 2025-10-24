import { FaHospital } from "react-icons/fa";
import { FaLocationDot } from "react-icons/fa6";
import { FaCar } from "react-icons/fa";
import { FaStar } from "react-icons/fa";
import { SpinnerDotted } from 'spinners-react';

import "../../styles/BloodDonation.css"

export default function Hospitals({ onSelect, showHospitals, searchQuery }) {
    const isSearching = searchQuery && searchQuery.trim() !== "";
    const hasResults = Array.isArray(showHospitals) && showHospitals.length > 0;

return (
    <div className="search-hospital">
      {/* Case 1: Searching but no results */}
      {isSearching && !hasResults && <p>No hospitals found.</p>}

      {/* Case 2: Searching with results */}
      {isSearching && hasResults && (
        <div className="urgent-needs">
          <h1>Search Results:</h1>
          {showHospitals.map((h) => (
            <button
              key={h.id}
              id="registered-hospital"
              className="hospital-info"
              type="button"
              onClick={() => onSelect(h)}
            >
              <div className="hospital-icon">
                <FaHospital />
              </div>
              <div className="info">
                <h2>{h.name}</h2>
                <div className="details">
                  <div className="location">
                    <FaLocationDot />
                    <small>{h.address}</small>
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Case 3: Not searching → show default content */}
      {!isSearching && (
        <>
        {hasResults ? ( 
          <>
            <div className="urgent-needs">
            <h1>Urgent Need:</h1>

            <button
              className="hospital-info"
              type="button"
              onClick={() =>
                onSelect({
                  id: 1,
                  name: "AL Rasool Al Aazam Hospital",
                  bloodType: "B+",
                  address: "Airport Street, Beirut",
                  slots: 12,
                })
              }
            >
              <div className="hospital-icon">
                <FaHospital />
              </div>

              <div className="info">
                <h2>
                  AL Rasool Al Aazam Hospital{" "}
                  <span className="urgent-blood-types animate-pulse bg-red-600">
                    Urgent: B+
                  </span>
                </h2>
                <div className="details">
                  <div className="location">
                    <FaLocationDot />
                    <small>Airport Street, Beirut</small>
                  </div>

                  <div className="distance">
                    <FaCar />
                    <small>2.3km</small>
                  </div>

                  <div className="rating">
                    <FaStar className="text-yellow-400" />
                    <FaStar className="text-yellow-400" />
                    <FaStar className="text-yellow-400" />
                    <FaStar className="text-yellow-400" />
                    <small>(4)</small>
                  </div>
                </div>
              </div>

              <div className="slots">
                <h2>12</h2>
                <small>Available Slots</small>
              </div>
            </button>
            </div>

            <div className="urgent-needs">
            <h1 className="register-hospital">Registered Hospitals:</h1>
            
              {showHospitals.map((h) => (
                <button
                  key={h.id}
                  id="registered-hospital"
                  className="hospital-info"
                  type="button"
                  onClick={() => onSelect(h)}
                >
                  <div className="hospital-icon">
                    <FaHospital />
                  </div>
                  <div className="info">
                    <h2>{h.name}</h2>
                    <div className="details">
                      <div className="location">
                        <FaLocationDot />
                        <small>{h.address}</small>
                      </div>

                        <div className="distance">
                            <FaCar />
                            <small>2.3km</small>
                        </div>
                    </div>
                    

                    <div className="slots">
                        <h2>12</h2>
                        <small>Available Slots</small>
                    </div>
                  </div>
                </button>
              ))}
              
          </div>
          </>
            ) : (
              <div className="loader">
                  <SpinnerDotted size={60} thickness={125} speed={100} color="#f01010ff" />                
                  <h3>Loading Hospitals</h3>
              </div>
            )}
        </>
      )}

    </div>
  );
}
