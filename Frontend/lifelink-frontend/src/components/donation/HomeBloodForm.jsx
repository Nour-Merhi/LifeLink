
import { useState, useEffect } from "react";

import FirstStep from "./homeBloodFormSteps/FirstStep";
import SecondStep from "./homeBloodFormSteps/SecondStep";
import ThirdStep from "./homeBloodFormSteps/ThirdStep";


export default function HomeBloodForm({ onSelect }){
    const [step, setStep] = useState(1);

    const nextStep = () => setStep(step + 1);
    const prevStep = () => setStep(step - 1);

    // Get booking data from localStorage
    const getBookingData = () => {
        const prefix = "home_";
        const storedHospital = localStorage.getItem(prefix + "hospital");
        const appointmentDate = localStorage.getItem("date");
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

    // Initialize form data - load from localStorage if available, otherwise use defaults
    const getInitialFormData = () => {
        const bookingData = getBookingData();
        const savedData = localStorage.getItem('home_blood_form_data');
        
        if (savedData) {
            try {
                const parsed = JSON.parse(savedData);
                // Merge saved data with booking data (booking data takes precedence)
                return {
                    first_name: parsed.first_name || '',
                    last_name: parsed.last_name || '',
                    email: parsed.email || '',
                    phone_nb: parsed.phone_nb || '',
                    address: parsed.address || '',
                    latitude: parsed.latitude || null,
                    longitude: parsed.longitude || null,
                    gender: parsed.gender || '',
                    date_of_birth: parsed.date_of_birth || '',
                    weight: parsed.weight || '',
                    blood_type: parsed.blood_type || '',
                    last_donation: parsed.last_donation || '',
                    emerg_contact: parsed.emerg_contact || '',
                    emerg_phone: parsed.emerg_phone || '',
                    medical_conditions: parsed.medical_conditions || {},
                    // Booking data takes precedence
                    ...bookingData
                };
            } catch (e) {
                console.warn('Error parsing saved form data:', e);
            }
        }
        
        return {
            first_name: '',
            last_name: '',
            email: '',
            phone_nb: '',
            address: '',
            latitude: null,
            longitude: null,
            gender: '',
            date_of_birth: '',
            weight: '',
            blood_type: '',
            last_donation: '',
            emerg_contact: '',
            emerg_phone: '',
            medical_conditions: {},
            // Booking data
            ...bookingData
        };
    };

    const [homeBloodFormData, setHomeBloodFormData] = useState(getInitialFormData());

    // Update booking data if it changes
    useEffect(() => {
        const bookingData = getBookingData();
        setHomeBloodFormData((prev) => ({
            ...prev,
            ...bookingData
        }));
    }, []);

   return (
    <>
        {step === 1 &&
            <FirstStep 
                nextStep={nextStep}
                homeBloodFormData = { homeBloodFormData }
                setHomeBloodFormData = { setHomeBloodFormData }
            />
        }

        {step === 2 &&
            <SecondStep 
                nextStep={nextStep} 
                prevStep={prevStep} 
                homeBloodFormData = { homeBloodFormData }
                setHomeBloodFormData = { setHomeBloodFormData }    
            />
        }

        {step === 3 &&
            <ThirdStep 
                nextStep={nextStep} 
                prevStep={prevStep} 
                homeBloodFormData = { homeBloodFormData }
                setHomeBloodFormData = { setHomeBloodFormData }    
            />
        }
    </>
   )
} 