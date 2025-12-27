import { FaHospital } from "react-icons/fa";
import { FaLocationDot } from "react-icons/fa6";
import { FaCar } from "react-icons/fa";
import { FaTint } from "react-icons/fa";
import { SpinnerDotted } from 'spinners-react';

import "../../styles/BloodDonation.css"


export default function Hospitals({ onSelect, showHospitals, searchQuery, urgentHospitals = [], regularHospitals = [] }) {
    const isSearching = searchQuery && searchQuery.trim() !== "";

    return (
    <div className="search-hospital">
      {/* Case 1: Searching but no results */}
      {isSearching && !hasResults && <p>No hospitals found.</p>}

      {/* Case 2: Searching with results */}
      {isSearching && hasResults && (
        <div className="urgent-needs">
          <h1>Search Results:</h1>
          {showHospitals.map((h) => {
            // Determine appointment type: if hospital has urgent flag or appears in urgent list, use urgent, otherwise regular
            const isUrgent = h.has_urgent || urgentHospitals.some(uh => uh.id === h.id);
            const appointmentType = isUrgent ? 'urgent' : 'regular';
            
            return (
            <button
              key={h.id}
              id="registered-hospital"
              className="hospital-info"
              type="button"
              onClick={() => onSelect({ ...h, appointment_type: appointmentType })}
            >
              <div className="info">
                <h2>{h.name}</h2>
                <div className="details">
                  <div className="location">
                    <FaLocationDot />
                    <small className="hosp-address" title={h.address}>{h.address}</small>
                  </div>
                </div>
              </div>
            </button>
            );
          })}
        </div>
      )}

      {/* Case 3: Not searching → show default content */}
      {!isSearching && (
        <>
        {hasResults ? ( 
          <>
            {/* Urgent Need Section - Dynamic */}
            {urgentHospitals && urgentHospitals.length > 0 && (
              <div className="urgent-needs">
                <h1>Urgent Need:</h1>
                {urgentHospitals.map((h) => {
                  // Format due date and time for display
                  const formatDueDate = (dateStr) => {
                    if (!dateStr) return '';
                    try {
                      const date = new Date(dateStr);
                      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric'});
                    } catch {
                      return dateStr;
                    }
                  };

                  const formatDueTime = (timeStr) => {
                    if (!timeStr) return '';
                    try {
                      const [hours, minutes] = timeStr.split(':');
                      const hour12 = parseInt(hours) % 12 || 12;
                      const ampm = parseInt(hours) >= 12 ? 'PM' : 'AM';
                      return `${hour12}:${minutes} ${ampm}`;
                    } catch {
                      return timeStr;
                    }
                  };

                  const dueDateStr = h.urgent_due_date ? formatDueDate(h.urgent_due_date) : '';
                  const dueTimeStr = h.urgent_due_time ? formatDueTime(h.urgent_due_time) : '';
                  const dueDisplay = dueDateStr && dueTimeStr ? `${dueDateStr} at ${dueTimeStr}` : (dueDateStr || dueTimeStr || 'Urgent');

                  return (
                    <button
                      key={h.id}
                      className="hospital-info"
                      type="button"
                      onClick={() => onSelect({ ...h, appointment_type: 'urgent' })}
                    >
                      <div className="hospital-icon">
                        <FaHospital />
                      </div>

                      <div className="info">
                        <h2>
                          {h.name}{" "}
                          <span className="urgent-blood-types animate-pulse bg-red-600">
                            Urgent: Due {dueDisplay}
                          </span>
                        </h2>
                        <div className="details">
                          <div className="location">
                            <FaLocationDot />
                            <small className="hosp-address" title={h.address}>{h.address || 'No address'}</small>
                          </div>

                          <div className="distance">
                            <FaCar />
                            <small>2.3km</small>
                          </div>

                          <div className="rating">
                            <FaTint className="text-red-500" />
                            <small>{h.blood_type_needed ? `Needed: ${h.blood_type_needed}` : 'All Types'}</small>
                          </div>
                        </div>
                      </div>

                      <div className="slots">
                        <h2>{h.urgent_slots !== undefined ? h.urgent_slots : (h.available_slots || 0)}</h2>
                        <small>Available Slots</small>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Regular Hospitals Section - Shows hospitals with regular appointments */}
            <div className="urgent-needs">
            <h1 className="register-hospital">Registered Hospitals:</h1>
            
              {(() => {
                // Use regularHospitals from backend, or fallback to filtering showHospitals
                const hospitalsToShow = regularHospitals.length > 0 
                  ? regularHospitals 
                  : showHospitals.filter(h => {
                      // If backend didn't provide regularHospitals, filter hospitals that don't have urgent
                      return !urgentHospitals.some(uh => uh.id === h.id) || h.has_regular;
                    });
                
                return hospitalsToShow.map((h) => (
                <button
                  key={h.id}
                  id="registered-hospital"
                  className="hospital-info"
                  type="button"
                  onClick={() => onSelect({ ...h, appointment_type: 'regular' })}
                >
                  <div className="hospital-icon">
                    <FaHospital />
                  </div>
                  <div className="info">
                    <h2>{h.name}</h2>
                    <div className="details">
                      <div className="location">
                        <FaLocationDot />
                        <small className="hosp-address" title={h.address}>{h.address}</small>
                      </div>

                        <div className="distance">
                            <FaCar />
                            <small>2.3km</small>
                        </div>

                        <div className="rating">
                            <FaTint className="text-red-500" />
                            <small>All Types</small>
                        </div>
                    </div>
                    

                    <div className="slots">
                        <h2>{h.regular_slots !== undefined ? h.regular_slots : (h.available_slots || 0)}</h2>
                        <small>Available Slots</small>
                    </div>
                  </div>
                </button>
                ));
              })()}
              
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
