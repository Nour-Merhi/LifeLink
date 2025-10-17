
import { useState } from "react";

import FirstStep from "./homeBloodFormSteps/FirstStep";
import SecondStep from "./homeBloodFormSteps/SecondStep";
import ThirdStep from "./homeBloodFormSteps/ThirdStep";


export default function HomeBloodForm({ onSelect }){
    const [step, setStep] = useState(1);

    const nextStep = () => setStep(step + 1);
    const prevStep = () => setStep(step - 1);

    const [homeBloodFormData, setHomeBloodFormData] = useState({
        first_name: '',
        last_name: '',
        email: '',
        phone_nb: '',
        address: '',
        gender: '',
        weight: '',
        blood_type: '',
        last_donation: '',
        emerg_contact: '',
        emerg_phone: '',
        medical_conditions: {},
    })

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