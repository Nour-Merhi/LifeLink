
import { useState, useEffect } from "react";

import FirstStep from "./homeBloodFormSteps/FirstStep";
import SecondStep from "./homeBloodFormSteps/SecondStep";
import ThirdStep from "./homeBloodFormSteps/ThirdStep";
import { useAuth } from "../../context/AuthContext";


export default function HomeBloodForm({ onSelect, pageType = "home" }){
    const { user } = useAuth();
    const [step, setStep] = useState(1);

    const nextStep = () => setStep(step + 1);
    const prevStep = () => setStep(step - 1);

    // Get booking data from localStorage
    const getBookingData = () => {
        const prefix = pageType === "home" ? "home_" : "hospital_";
        const storedHospital = localStorage.getItem(prefix + "hospital");
        const appointmentDate = localStorage.getItem(prefix + "date") || localStorage.getItem("date");
        const appointmentTime = localStorage.getItem("appointment_time");
        
        let hospital = null;
        try {
            hospital = storedHospital ? JSON.parse(storedHospital) : null;
        } catch (e) {
            console.warn("Invalid JSON in hospital localStorage:", storedHospital);
        }

        return {
            hospital_id: hospital?.id || null,
            hospital_name: hospital?.name || '',
            appointment_date: appointmentDate || '',
            appointment_time: appointmentTime || ''
        };
    };

    // Initialize form data - load from localStorage if available, otherwise use defaults or user data
    const getInitialFormData = () => {
        const bookingData = getBookingData();
        const formDataKey = pageType === "home" ? 'home_blood_form_data' : 'hospital_blood_form_data';
        const savedData = localStorage.getItem(formDataKey);
        
        // Get user data for pre-filling
        const getUserData = () => {
            if (!user) return {};
            
            const donor = user.donor || {};
            const bloodType = donor.bloodType || donor.blood_type || null;
            const bloodTypeString = bloodType 
                ? `${bloodType.type || ''}${bloodType.rh_factor || ''}` 
                : '';
            
            // Format date_of_birth for input field (YYYY-MM-DD)
            let formattedDob = '';
            if (donor.date_of_birth) {
                const dobDate = new Date(donor.date_of_birth);
                formattedDob = dobDate.toISOString().split('T')[0];
            }
            
            // Format last_donation for input field (YYYY-MM-DD)
            let formattedLastDonation = '';
            if (donor.last_donation) {
                const lastDonationDate = new Date(donor.last_donation);
                formattedLastDonation = lastDonationDate.toISOString().split('T')[0];
            }
            
            // Check if phone_nb is a temporary value (starts with 'temp_')
            const phoneNumber = user.phone_nb && !user.phone_nb.startsWith('temp_') ? user.phone_nb : '';
            
            return {
                first_name: user.first_name || '',
                last_name: user.last_name || '',
                email: user.email || '',
                phone_nb: phoneNumber,
                city: user.city || '',
                date_of_birth: formattedDob,
                gender: donor.gender || '',
                blood_type: bloodTypeString,
                last_donation: formattedLastDonation,
            };
        };
        
        const userData = getUserData();
        
        if (savedData) {
            try {
                const parsed = JSON.parse(savedData);
                
                // Check if saved data belongs to current user
                // If email doesn't match, it's from a different user - clear it
                if (user && parsed.email && parsed.email !== user.email) {
                    console.log('Clearing form data from different user');
                    localStorage.removeItem(formDataKey);
                    // Return fresh user data instead
                    return {
                        ...userData,
                        address: userData.address || '',
                        latitude: null,
                        longitude: null,
                        weight: '',
                        emerg_contact: '',
                        emerg_phone: '',
                        medical_conditions: {},
                        // Booking data
                        ...bookingData
                    };
                }
                
                // Merge: saved data > user data > defaults (saved data takes precedence)
                return {
                    ...userData, // Start with user data
                    ...parsed, // Override with saved data (user's previous form entries)
                    address: parsed.address || userData.address || '',
                    latitude: parsed.latitude || null,
                    longitude: parsed.longitude || null,
                    weight: parsed.weight || '',
                    emerg_contact: parsed.emerg_contact || '',
                    emerg_phone: parsed.emerg_phone || '',
                    medical_conditions: parsed.medical_conditions || {},
                    // Booking data takes precedence
                    ...bookingData
                };
            } catch (e) {
                console.warn('Error parsing saved form data:', e);
                // Clear corrupted data
                localStorage.removeItem(formDataKey);
            }
        }
        
        // No saved data - use user data with defaults
        return {
            ...userData,
            address: userData.address || '',
            latitude: null,
            longitude: null,
            weight: '',
            emerg_contact: '',
            emerg_phone: '',
            medical_conditions: {},
            // Booking data
            ...bookingData
        };
    };

    const [homeBloodFormData, setHomeBloodFormData] = useState(getInitialFormData());

    // Clear form data when user changes (different user logged in)
    useEffect(() => {
        if (!user) return;
        
        const formDataKey = pageType === "home" ? 'home_blood_form_data' : 'hospital_blood_form_data';
        const savedData = localStorage.getItem(formDataKey);
        if (savedData) {
            try {
                const parsed = JSON.parse(savedData);
                // If saved data email doesn't match current user email, clear it
                if (parsed.email && parsed.email !== user.email) {
                    console.log('User changed - clearing previous user\'s form data');
                    localStorage.removeItem(formDataKey);
                    // Reset form with current user's data
                    const bookingData = getBookingData();
                    const getUserData = () => {
                        const donor = user.donor || {};
                        const bloodType = donor.bloodType || donor.blood_type || null;
                        const bloodTypeString = bloodType 
                            ? `${bloodType.type || ''}${bloodType.rh_factor || ''}` 
                            : '';
                        
                        let formattedDob = '';
                        if (donor.date_of_birth) {
                            const dobDate = new Date(donor.date_of_birth);
                            formattedDob = dobDate.toISOString().split('T')[0];
                        }
                        
                        let formattedLastDonation = '';
                        if (donor.last_donation) {
                            const lastDonationDate = new Date(donor.last_donation);
                            formattedLastDonation = lastDonationDate.toISOString().split('T')[0];
                        }
                        
                        const phoneNumber = user.phone_nb && !user.phone_nb.startsWith('temp_') ? user.phone_nb : '';
                        
                        return {
                            first_name: user.first_name || '',
                            last_name: user.last_name || '',
                            email: user.email || '',
                            phone_nb: phoneNumber,
                            city: user.city || '',
                            date_of_birth: formattedDob,
                            gender: donor.gender || '',
                            blood_type: bloodTypeString,
                            last_donation: formattedLastDonation,
                        };
                    };
                    
                    const userData = getUserData();
                    setHomeBloodFormData({
                        ...userData,
                        address: '',
                        latitude: null,
                        longitude: null,
                        weight: '',
                        emerg_contact: '',
                        emerg_phone: '',
                        medical_conditions: {},
                        ...bookingData
                    });
                    return;
                }
            } catch (e) {
                console.warn('Error checking saved form data:', e);
            }
        }
    }, [user?.email]); // Only run when user email changes

    // Update form data when user or booking data changes
    useEffect(() => {
        const bookingData = getBookingData();
        const getUserData = () => {
            if (!user) return {};
            
            const donor = user.donor || {};
            const bloodType = donor.bloodType || donor.blood_type || null;
            const bloodTypeString = bloodType 
                ? `${bloodType.type || ''}${bloodType.rh_factor || ''}` 
                : '';
            
            let formattedDob = '';
            if (donor.date_of_birth) {
                const dobDate = new Date(donor.date_of_birth);
                formattedDob = dobDate.toISOString().split('T')[0];
            }
            
            let formattedLastDonation = '';
            if (donor.last_donation) {
                const lastDonationDate = new Date(donor.last_donation);
                formattedLastDonation = lastDonationDate.toISOString().split('T')[0];
            }
            
            // Check if phone_nb is a temporary value (starts with 'temp_')
            const phoneNumber = user.phone_nb && !user.phone_nb.startsWith('temp_') ? user.phone_nb : '';
            
            return {
                first_name: user.first_name || '',
                last_name: user.last_name || '',
                email: user.email || '',
                phone_nb: phoneNumber,
                city: user.city || '',
                date_of_birth: formattedDob,
                gender: donor.gender || '',
                blood_type: bloodTypeString,
                last_donation: formattedLastDonation,
            };
        };
        
        const userData = getUserData();
        
        // Only update fields that are empty, don't override user's manual entries
        // But always update email to ensure it matches current user
        setHomeBloodFormData((prev) => {
            // If email changed, it's a different user - reset form
            if (user && prev.email && prev.email !== user.email) {
                return {
                    ...userData,
                    address: '',
                    latitude: null,
                    longitude: null,
                    weight: '',
                    emerg_contact: '',
                    emerg_phone: '',
                    medical_conditions: {},
                    ...bookingData
                };
            }
            
            return {
            ...prev,
                // Always update email to current user's email
                email: userData.email || prev.email || '',
            // Pre-fill empty fields with user data, but keep existing values
            first_name: prev.first_name || userData.first_name || '',
            last_name: prev.last_name || userData.last_name || '',
                phone_nb: prev.phone_nb || userData.phone_nb || '',
            date_of_birth: prev.date_of_birth || userData.date_of_birth || '',
            gender: prev.gender || userData.gender || '',
            blood_type: prev.blood_type || userData.blood_type || '',
            last_donation: prev.last_donation || userData.last_donation || '',
                // Booking data always updates (hospital_id, hospital_name, appointment_date, appointment_time)
            ...bookingData
            };
        });
    }, [user, pageType]);

    // Also update booking data when component mounts or when localStorage changes
    useEffect(() => {
        const bookingData = getBookingData();
        setHomeBloodFormData((prev) => ({
            ...prev,
            // Always update booking-related fields from localStorage
            hospital_id: bookingData.hospital_id,
            hospital_name: bookingData.hospital_name,
            appointment_date: bookingData.appointment_date,
            appointment_time: bookingData.appointment_time,
        }));
    }, [pageType]); // Run when pageType changes or on mount

   return (
    <>
        {step === 1 &&
            <FirstStep 
                nextStep={nextStep}
                homeBloodFormData = { homeBloodFormData }
                setHomeBloodFormData = { setHomeBloodFormData }
                pageType = { pageType }
            />
        }

        {step === 2 &&
            <SecondStep 
                nextStep={nextStep} 
                prevStep={prevStep} 
                homeBloodFormData = { homeBloodFormData }
                setHomeBloodFormData = { setHomeBloodFormData }
                pageType = { pageType }
            />
        }

        {step === 3 &&
            <ThirdStep 
                nextStep={nextStep} 
                prevStep={prevStep} 
                homeBloodFormData = { homeBloodFormData }
                setHomeBloodFormData = { setHomeBloodFormData }
                pageType = { pageType }
            />
        }
    </>
   )
} 