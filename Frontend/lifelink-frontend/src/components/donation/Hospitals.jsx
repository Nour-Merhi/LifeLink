import { FaHospital } from "react-icons/fa";
import { FaLocationDot } from "react-icons/fa6";
import { FaCar } from "react-icons/fa";
import { FaTint } from "react-icons/fa";
import { SpinnerDotted } from 'spinners-react';

import "../../styles/BloodDonation.css"



/**
 * Returns true if the donor can see this hospital based on blood type.
 * - Hospital needs "all" (null/empty) → show to all donors
 * - Hospital needs specific type (e.g. O+) → show only to donors with that exact blood type
 * - Guest (no donorBloodType) → show all hospitals
 */
function canDonorSeeHospital(donorBloodType, hospital) {
  const needed = hospital?.blood_type_needed;
  if (!needed || needed === '' || String(needed).toLowerCase() === 'all') return true;
  if (!donorBloodType) return true; // guest sees all
  const neededNorm = String(needed).trim().toUpperCase();
  const donorNorm = String(donorBloodType).trim().toUpperCase();
  return donorNorm === neededNorm;
}

function filterByBloodType(list, donorBloodType) {
  if (!list || !Array.isArray(list)) return [];
  if (!donorBloodType) return list;
  return list.filter((h) => canDonorSeeHospital(donorBloodType, h));
}

export default function Hospitals({ onSelect, showHospitals, searchQuery, urgentHospitals = [], regularHospitals = [], disableSelection = false, donorBloodType = null }) {
    const isSearching = searchQuery && searchQuery.trim() !== "";

    // Urgent: filter by donor blood type (only show if donor matches needed type)
    const filteredUrgentHospitals = filterByBloodType(urgentHospitals, donorBloodType);
    // Regular: always show all (blood type = "all" for regular appointments)
    const filteredRegularHospitals = regularHospitals || [];
    // Search results: filter by blood type (urgent hospitals filtered, regular pass through)
    const filteredShowHospitals = filterByBloodType(showHospitals, donorBloodType);
    
    const toNumber = (v) => {
      const n = Number(v);
      return Number.isFinite(n) ? n : 0;
    };

    const getSlotsCount = (h, type) => {
      if (!h) return 0;
      if (type === "urgent") {
        if (h.urgent_slots !== undefined && h.urgent_slots !== null) return toNumber(h.urgent_slots);
        if (h.available_slots !== undefined && h.available_slots !== null) return toNumber(h.available_slots);
        return 0;
      }
      if (type === "regular") {
        if (h.regular_slots !== undefined && h.regular_slots !== null) return toNumber(h.regular_slots);
        if (h.available_slots !== undefined && h.available_slots !== null) return toNumber(h.available_slots);
        return 0;
      }
      // fallback
      return toNumber(h.available_slots);
    };

    // Calculate hasResults based on current state (use filtered lists)
    const hasResults = isSearching 
        ? (filteredShowHospitals && filteredShowHospitals.length > 0)
        : ((filteredUrgentHospitals && filteredUrgentHospitals.length > 0) || (filteredRegularHospitals && filteredRegularHospitals.length > 0) || (filteredShowHospitals && filteredShowHospitals.length > 0));

    return (
    <div className="search-hospital">
      {/* Case 1: Searching but no results */}
      {isSearching && !hasResults && <p>No hospitals found.</p>}

      {/* Case 2: Searching with results */}
      {isSearching && hasResults && (
        <div className="urgent-needs">
          <h1>Search Results:</h1>
          {filteredShowHospitals.map((h) => {
            // Determine appointment type: if hospital has urgent flag or appears in urgent list, use urgent, otherwise regular
            const isUrgent = h.has_urgent || filteredUrgentHospitals.some(uh => uh.id === h.id);
            const appointmentType = isUrgent ? 'urgent' : 'regular';
            const slotsCount = getSlotsCount(h, appointmentType);
            const isDisabled = disableSelection || slotsCount <= 0;
            
            return (
            <button
              key={h.id}
              id="registered-hospital"
              className="hospital-info"
              type="button"
              disabled={isDisabled}
              aria-disabled={isDisabled}
              style={isDisabled ? { opacity: 0.6, cursor: "not-allowed" } : undefined}
              onClick={() => {
                if (isDisabled) return;
                onSelect({ ...h, appointment_type: appointmentType });
              }}
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
              <div className="slots">
                <h2>{slotsCount}</h2>
                <small>Available Slots</small>
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
            {/* Urgent Need Section - filtered by donor blood type */}
            {filteredUrgentHospitals && filteredUrgentHospitals.length > 0 && (
              <div className="urgent-needs">
                
                {filteredUrgentHospitals.map((h) => {
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
                  const slotsCount = getSlotsCount(h, "urgent");
                  const isDisabled = disableSelection || slotsCount <= 0;

                  return (
                    <button
                      key={h.id}
                      className="hospital-info"
                      type="button"
                      disabled={isDisabled}
                      aria-disabled={isDisabled}
                      style={isDisabled ? { opacity: 0.6, cursor: "not-allowed" } : undefined}
                      onClick={() => {
                        if (isDisabled) return;
                        onSelect({ ...h, appointment_type: 'urgent' });
                      }}
                    >
                      <div className="hospital-icon">
                        <FaHospital />
                      </div>

                      <div className="info">
                        <div className="flex flex-row">
                          <h2>
                            {h.name}{" "}
                          </h2>
                          <span className="urgent-blood-types animate-pulse bg-red-500">
                            Urgent: {dueDisplay}
                          </span>
                        </div>
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
                        <h2>{slotsCount}</h2>
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
                // Regular hospitals: show all (no blood type filter). Fallback to showHospitals if backend didn't provide regularHospitals.
                const hospitalsToShow = filteredRegularHospitals.length > 0 
                  ? filteredRegularHospitals 
                  : (showHospitals || []).filter(h => 
                      !filteredUrgentHospitals.some(uh => uh.id === h.id) || h.has_regular
                    );
                
                return hospitalsToShow.map((h) => (
                (() => {
                  const slotsCount = getSlotsCount(h, "regular");
                  const isDisabled = disableSelection || slotsCount <= 0;
                  return (
                <button
                  key={h.id}
                  id="registered-hospital"
                  className="hospital-info"
                  type="button"
                  disabled={isDisabled}
                  aria-disabled={isDisabled}
                  style={isDisabled ? { opacity: 0.6, cursor: "not-allowed" } : undefined}
                  onClick={() => {
                    if (isDisabled) return;
                    onSelect({ ...h, appointment_type: 'regular' });
                  }}
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
                        <h2>{slotsCount}</h2>
                        <small>Available Slots</small>
                    </div>
                  </div>
                </button>
                  );
                })()
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
