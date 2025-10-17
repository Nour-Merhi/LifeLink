import { useState, useEffect } from "react";
import { GoHeartFill } from "react-icons/go";
import { GiKidneys, GiLiver } from "react-icons/gi";
import { FaEye } from "react-icons/fa";

import ThankModalAfterDeath from "../components/donation/ThankModals/ThankModalAfterDeath";

import Step1 from "../components/donation/afterLifeOrganForm/AferDeathStepOne";
import Step2 from "../components/donation/afterLifeOrganForm/AfterDeathStepTwo";
import Step3 from "../components/donation/afterLifeOrganForm/AfterDeathStepThree";

export default function OrganDead() {
    const [thankMess, setThankMess] = useState(false);

    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState({
        birth_date: "",
        age: null
    });

    const nextStep = () => setStep((prev) => prev + 1);
    const prevStep = () => setStep((prev) => prev - 1);

    const handleCloseModal = () => {
        setThankMess(false);
        setStep(1);
    };

    useEffect(() => {
        window.scrollTo({ top: 0, behavior: "smooth" });
    }, [step]);

    
    return (
        <section className="organ organ-section">
            { step === 1 && (
                <>
                    <div className="header">
                        <h1>Leave a Legacy of Life - Pledge Your Organs Today</h1>
                        <p>One donor can save up to 8 lives. Your decision now can bring hope to many after you're gone.</p>
                        <button 
                            className="pledge-btn animate-bounce"
                            onClick={() =>
                                document.getElementById("after-death-donor")
                                ?.scrollIntoView({ behavior: "smooth", block: "start" })
                            }
                        >
                            Pledge Now
                        </button>
                    </div>

                    <div className="box-container why-register">
                        <h2>Why After-Death Donation Matters</h2>
                        <div className="why-reason">
                            <p>Thousands of patients die every year waiting for an organ. By pledging your organs, you give the greatest gift possible — the chance to live.</p>
                        </div>
                        <div className="organs">
                            <div className="organ-card">
                                <div className="organ-icon color"><GoHeartFill /></div>
                                <h3>Heart</h3>
                                <p>Restores life for those with heart failure</p>
                            </div>

                            <div className="organ-card">
                                <div className="organ-icon color"><GiKidneys /></div>
                                <h3>Kidneys</h3>
                                <p>Two Kidneys can save two livese</p>
                            </div>

                            <div className="organ-card">
                                <div className="organ-icon color"><GiLiver /></div>
                                <h3>Liver</h3>
                                <p>Liver regenerates and can save two lives</p>
                            </div>

                            <div className="organ-card">
                                <div className="organ-icon color"><FaEye /></div>
                                <h3>Eye</h3>
                                <p>Restore vision to the blind</p>
                            </div>
                        </div>
                    </div>

                    <div className="box-container donation-process">
                        <h2>Donation Process</h2>
                        <div className="process-steps">
                            <div className="step">
                                <div className="step-number">1</div>
                                <h3>Register Your Pledge Online</h3>
                                <p>Complete your organ donation pledge with our secure online form.</p>
                            </div>

                            <div className="step">
                                <div className="step-number">2</div>
                                <h3>Share Your Decision with Family</h3>
                                <p>Inform your loved ones about your noble decision to save lives.</p>
                            </div>

                            <div className="step">
                                <div className="step-number">3</div>
                                <h3>Hospitals Access Your Consent</h3>
                                <p>Medical teams can quickly access your donation preferences when needed.</p>
                            </div>

                            <div className="step">
                                <div className="last-step-number">4</div>
                                <h3>Lives Are Saved</h3>
                                <p>Your gift brings hope and new life to patients waiting for transplants.</p>
                            </div>
                        </div>
                    </div>

                    {/* Step 1 Form */}
                    <Step1
                        nextStep={nextStep}
                        afterDeathFormData={formData}
                        setAfterDeathFormData={setFormData}
                    />

                    <div className="faq-section">
                        <h2 className="text-center mb-4">Frequently Asked Questions</h2>
                        <div className="faq-item">
                            <div className="faq-question">
                                <h3>Can I change my mind after pledging?</h3>
                                <p>Absolutely. You can update or withdraw your organ donation pledge at any time by re-registering or contacting us.</p>
                            </div>
                            <div className="faq-question">
                                <h3>Will my medical care be affected if I'm a donor?</h3>
                                <p>No. Your medical care will never be compromised because of your decision to donate organs.</p>
                            </div>
                            <div className="faq-question">
                                <h3>Are there any costs to my family for organ donation?</h3>
                                <p>No. There are no costs to your family for organ donation. All expenses related to the donation process are covered by the recipient's insurance or the transplant program.</p>
                            </div>
                            <div className="faq-question">
                                <h3>How are organs allocated to recipients?</h3>
                                <p>Organs are allocated based on medical urgency, compatibility, and time spent on the waiting list, following strict ethical guidelines.</p>
                            </div>
                            <div className="faq-question">
                                <h3>Can I specify which organs to donate?</h3>
                                <p>Yes. You can choose to donate specific organs or tissues according to your preferences.</p>
                            </div>
                            <div className="faq-question">
                                <h3>Can I specify which organs to donate?</h3>
                                <p>Yes. You can choose to donate specific organs or tissues according to your preferences.</p>
                            </div>
                        </div>
                    </div>

                    <div className="data-privacy">
                        <p>All your information is kept confidential and shared only with partner hospitals for evaluation purposes. We use industry-standard encryption to protect your data and comply with all medical privacy regulations.</p>
                    </div>
                </>
            )}

            {step === 2 && (
                <Step2
                    prevStep={prevStep}
                    nextStep={nextStep}
                    afterDeathFormData={formData}
                    setAfterDeathFormData={setFormData}
                />
            )}

            {step === 3 && (
                <Step3
                    prevStep={prevStep}
                    setThankMess={setThankMess}
                    afterDeathFormData={formData}
                    setAfterDeathFormData={setFormData}
                />
            )}

            { thankMess &&
                <ThankModalAfterDeath onClose = {handleCloseModal}/>
            }
        </section>
    )
}