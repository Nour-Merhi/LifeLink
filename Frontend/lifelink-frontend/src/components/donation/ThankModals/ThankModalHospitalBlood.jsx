import { IoCheckmarkSharp } from "react-icons/io5";
import { useState, useEffect } from "react";
import { useAuth } from "../../../context/AuthContext";
import api from "../../../api/axios";
import "../../../styles/BloodDonation.css";
import React from 'react';
import SuccessAnimation from "../../../animations/animationSuccess.jsx";

export default function ThankModalHospitalBlood({hospitalAppt, onClose}){ 
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone_nb: '',
    gender: '',
    blood_type: '',
    date_of_birth: '',
    last_donation: '',
  });

  // Pre-fill form data from authenticated user if available
  useEffect(() => {
    if (user) {
      const donor = user.donor || {};
      const bloodType = donor.bloodType || donor.blood_type;
      const bloodTypeString = bloodType 
        ? `${bloodType.type || ''}${bloodType.rh_factor || ''}` 
        : '';
      
      // Format date_of_birth
      let formattedDob = '';
      if (donor.date_of_birth) {
        const dobDate = new Date(donor.date_of_birth);
        formattedDob = dobDate.toISOString().split('T')[0];
      }
      
      // Format last_donation
      let formattedLastDonation = '';
      if (donor.last_donation) {
        const lastDonationDate = new Date(donor.last_donation);
        formattedLastDonation = lastDonationDate.toISOString().split('T')[0];
      }

      const phoneNumber = user.phone_nb && !user.phone_nb.startsWith('temp_') ? user.phone_nb : '';

      setFormData({
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        email: user.email || '',
        phone_nb: phoneNumber,
        gender: donor.gender || '',
        blood_type: bloodTypeString,
        date_of_birth: formattedDob,
        last_donation: formattedLastDonation,
      });
    }
  }, [user]);

  // Don't auto-show form on mount - wait for user to press "Confirm & Submit"

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  async function submitAppointment() {
    if (submitted || loading) return;
    
    setLoading(true);
    setError("");

    try {
      // Get hospital_id from hospitalAppt
      const hospitalId = hospitalAppt.hospital_id || hospitalAppt.hospital?.id;
      
      if (!hospitalId) {
        throw new Error('Hospital ID is required');
      }

      // Use form data or user data
      const donorData = showForm ? formData : {
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        email: user.email || '',
        phone_nb: user.phone_nb && !user.phone_nb.startsWith('temp_') ? user.phone_nb : '',
        gender: user.donor?.gender || '',
        blood_type: user.donor?.bloodType ? `${user.donor.bloodType.type}${user.donor.bloodType.rh_factor}` : '',
        date_of_birth: user.donor?.date_of_birth ? new Date(user.donor.date_of_birth).toISOString().split('T')[0] : '',
        last_donation: user.donor?.last_donation ? new Date(user.donor.last_donation).toISOString().split('T')[0] : null,
      };

      // Validate required fields
      if (!donorData.first_name || !donorData.last_name || !donorData.email || !donorData.phone_nb || 
          !donorData.gender || !donorData.blood_type || !donorData.date_of_birth) {
        throw new Error('Please fill in all required fields');
      }

      // Check eligibility: last donation must be at least 56 days ago
      if (donorData.last_donation) {
        const lastDonationDate = new Date(donorData.last_donation);
        const today = new Date();
        const daysSinceLastDonation = Math.floor((today - lastDonationDate) / (1000 * 60 * 60 * 24));
        
        if (daysSinceLastDonation < 56) {
          const daysRemaining = 56 - daysSinceLastDonation;
          throw new Error(`You are not eligible to donate yet. You must wait at least 56 days between donations. You can donate again in ${daysRemaining} day${daysRemaining !== 1 ? 's' : ''}.`);
        }
      }

      // Prepare complete appointment data
      const appointmentData = {
        ...donorData,
        hospital_id: hospitalId,
        appointment_date: hospitalAppt.appointment_date,
        appointment_time: hospitalAppt.appointment_time,
        note: hospitalAppt.note || null,
      };

      console.log('Submitting hospital appointment:', appointmentData);

      await api.get("sanctum/csrf-cookie")
      const response = await api.post("/api/hospital/appointments", appointmentData);
      console.log('Hospital appointment saved:', response.data);
      setSubmitted(true);
      setShowForm(false);
    } catch (error) {
      console.error('Error saving hospital appointment:', error);
      console.error('Error response:', error.response?.data);
      
      // Handle validation errors
      if (error.response?.data?.errors) {
        const errors = error.response.data.errors;
        const errorMessages = Object.values(errors).flat().join(', ');
        setError(errorMessages || error.response?.data?.message || 'Validation failed. Please check your input.');
      } else {
        const errorMessage = error.response?.data?.message 
          || error.response?.data?.error 
          || error.message 
          || 'Failed to save appointment. Please try again.';
        setError(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  }

  if (showForm && !submitted) {
    return (
      <div className="modal-overlay text-left">
        <div className="modal-container">
          <p>Please provide your information to complete the appointment booking:</p>
          
          {error && (
            <div style={{ color: 'red', marginBottom: '10px', padding: '10px', background: '#ffebee', borderRadius: '4px' }}>
              <small>{error}</small>
            </div>
          )}
        
          <form className="form" onSubmit={(e) => { e.preventDefault(); submitAppointment(); }}>
            <div className="form-group">
              <div>
                <label>First Name *</label>
                <input 
                  type="text" 
                  name="first_name" 
                  value={formData.first_name}
                  onChange={handleInputChange}
                  required
                />
              </div>
              
              <div>
                <label>Last Name *</label>
                <input 
                  type="text" 
                  name="last_name" 
                  value={formData.last_name}
                  onChange={handleInputChange}
                  required
                />
              </div>
              </div>

              <div className="form-group">
                <div>
                  <label>Email *</label>
                  <input 
                    type="email" 
                    name="email" 
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div>
                  <label>Phone Number *</label>
                  <input 
                    type="text" 
                    name="phone_nb" 
                    value={formData.phone_nb}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <div>
                  <label>Gender *</label>
                  <select 
                    name="gender" 
                    value={formData.gender}
                    onChange={handleInputChange}
                    required
                    style={{ width: '100%', padding: '8px', marginTop: '5px' }}
                  >
                    <option value="">Select Gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                  </select>
                </div>
                <div>
                  <label>Blood Type *</label>
                  <input 
                    type="text" 
                    name="blood_type" 
                    value={formData.blood_type}
                    onChange={handleInputChange}
                    placeholder="e.g., A+, B-, O+, AB+"
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <div>
                  <label>Date of Birth *</label>
                  <input 
                    type="date" 
                    name="date_of_birth" 
                    value={formData.date_of_birth}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div>
                  <label>Last Donation Date</label>
                  <input 
                    type="date" 
                    name="last_donation" 
                    value={formData.last_donation}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

            <div className="form-actions">
              <button 
                type="button"
                onClick={() => {
                  setShowForm(false);
                  onClose();
                }}
                disabled={loading}
                className="cancel-btn"
              >
                Cancel
              </button>
              <button 
                type="submit"
                className="next-step-btn color"
                disabled={loading}
              >
                {loading ? 'Submitting...' : 'Submit Appointment'}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="modal-overlay">
      <div className="modal-box">
      <div className="complete">
        {submitted && <SuccessAnimation />}

        <h3>
          {submitted ? 'Appointment Completed!' : 'Confirm Appointment'}
        </h3>
      </div>


        <div className="app-info">
            <div className="pb-3">
                <small>Hospital:</small>
                <small>{ hospitalAppt.hospital_name || hospitalAppt.hospital?.name }</small>
            </div>
            <div className="pb-3">
                <small>Date:</small>
                <small>{ hospitalAppt.appointment_date }</small>
            </div>
            <div>
                <small>Time:</small>
                <small>{ hospitalAppt.appointment_time }</small>
            </div>
        </div>

        <div className="conf-mess">
          {error && (
            <div style={{ color: 'red', marginBottom: '10px', padding: '10px', background: '#ffebee', borderRadius: '4px' }}>
              <small>{error}</small>
            </div>
          )}
          {loading && (
            <small>Submitting appointment...</small>
          )}
          {!loading && !error && submitted && (
            <small>A confirmation email has been sent to your registered email address. Please check.</small>
          )}
          {!submitted && !loading && (
            <small>Please confirm your appointment details below.</small>
          )}
          <button 
            className="modal-btn" 
            onClick={async () => {
              if (!submitted && !loading) {
                // Check if user needs to fill form before submitting
                if (!user || !user.donor || !user.donor.bloodType) {
                  // User doesn't have complete info, show form
                  setShowForm(true);
                } else {
                  // User has complete info, submit directly
                  await submitAppointment();
                }
              } else {
                onClose();
              }
            }}
            disabled={loading}
          >
            {loading ? 'Submitting...' : submitted ? 'Back Home' : 'Confirm & Submit'}
          </button>
        </div>
      </div>
    </div>
  );
}