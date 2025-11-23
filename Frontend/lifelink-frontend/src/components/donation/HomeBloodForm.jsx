
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

    const [homeBloodFormData, setHomeBloodFormData] = useState({
        first_name: '',
        last_name: '',
        email: '',
        phone_nb: '',
        address: '',
        gender: '',
        date_of_birth: '',
        weight: '',
        blood_type: '',
        last_donation: '',
        emerg_contact: '',
        emerg_phone: '',
        medical_conditions: {},
        // Booking data
        ...getBookingData()
    })

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