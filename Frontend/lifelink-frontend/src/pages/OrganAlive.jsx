import "../styles/OrganDonation.css"
import { GiKidneys } from "react-icons/gi";
import { GiLiver } from "react-icons/gi";
import { PiBoneFill } from "react-icons/pi";
import { IoIosWarning } from "react-icons/io";


import { animate, motion, useMotionValue, useTransform } from "motion/react"
import { useEffect } from "react"
import AliveOrganForm from "../components/donation/AliveOrganForm";

function TenContent() {
    const count = useMotionValue(0)
    const rounded = useTransform(() => Math.round(count.get()))

    useEffect(() => {
        const controls = animate(count, 17, { duration: 5 })
        return () => controls.stop()
    }, [])

    return <motion.pre className="text-red-500 text-3xl font-semibold">{rounded}</motion.pre>
}

function Content() {
    const count = useMotionValue(0)
    const rounded = useTransform(() => Math.round(count.get()))

    useEffect(() => {
        const controls = animate(count, 100000 , { duration: 5 })
        return () => controls.stop()
    }, [])

    return <motion.pre className="text-red-500 text-3xl font-semibold">{rounded}</motion.pre>
}




export default function OrganAlive() {
    
    return (
        <section className="organ organ-section">
            <div className="header">
                <h1>Give the Gift of Life – Become a Live Organ Donor</h1>
                <p>Your willingness can bring hope to patients waiting for a life-saving transplant. Start Registration</p>
                <button 
                    className="pledge-btn animate-bounce"
                     onClick={() =>
                        document.getElementById("live-donor")
                        ?.scrollIntoView({ behavior: "smooth", block: "start" })
                    }
                
                >Register Now</button>
            </div>

            <div className="imp-mess">
                <div>
                    <IoIosWarning className="text-xl"/>
                    <h3 className="font-semibold text-xl">Important Medical Evaluation Required</h3>
                </div>
                <p>Living organ donation requires extensive medical and psychological evaluation. This form is the first step in a comprehensive screening process that prioritizes donor safety.</p>
            </div>

            <div className="box-container why-register">
                <h2>Why Live Organ Donation Matters</h2>
                <div className="organs">
                    <div className="organ-card">
                        <div className="organ-icon color"><GiKidneys /></div>
                        <h3>Kidney</h3>
                        <p>You can live normally with one healthy kidney</p>
                    </div>

                    <div className="organ-card">
                        <div className="organ-icon color"><GiLiver /></div>
                        <h3>Liver (Portion)</h3>
                        <p>Liver regenerates after partial donation</p>
                    </div>

                    <div className="organ-card">
                        <div className="organ-icon color"><PiBoneFill /></div>
                        <h3>Bone Marrow</h3>
                        <p>Bone marrow regenerates naturally</p>
                    </div>
                </div>

                <div className="why-reason">
                    <div className="nb-death">
                        <TenContent />
                        <p>People die daily waiting for organs</p>
                    </div>

                    <div className="nb-wait-list">
                        <h3 style={{display: "flex", justifyContent:"center", fontSize: "24px", fontWeight: "700", color:"red"}}><Content/>  +</h3>
                        <p>People on transplant waiting list</p>
                    </div>
                </div>
            </div>

                <div className="box-container donation-process">
                    <h2>How It Works - 3 Simple Steps</h2>
                    <div className="process-steps">
                        <div className="step">
                            <div className="step-number">1</div>
                            <h3>Register Your Interest</h3>
                            <p>Complete our simple online form with your basic information and health details</p>
                        </div>

                        <div className="step">
                            <div className="step-number">2</div>
                            <h3>Hospital Review & Contact</h3>
                            <p>Your assigned hospital reviews your details and contacts you within 48 hours</p>
                        </div>

                        <div className="step">
                            <div className="step-number">3</div>
                            <h3>Medical & Legal Evaluation</h3>
                            <p>Complete medical tests and legal approval process at the hospital</p>
                        </div>
                    </div>

                </div>

                <AliveOrganForm />

                <div className="faq-section">
                    <h2 className="text-center mb-4">Frequently Asked Questions</h2>
                    <div className="faq-item">
                        <div className="faq-question animate-slide-in-up animate-once">
                            <h3>Can I change my mind after pledging?</h3>
                            <p>Absolutely. You can update or withdraw your organ donation pledge at any time by re-registering or contacting us.</p>
                        </div>
                        <div className="faq-question animate-slide-in-up animate-once">
                            <h3>Will my medical care be affected if I'm a donor?</h3>
                            <p>No. Your medical care will never be compromised because of your decision to donate organs.</p>
                        </div>
                        <div className="faq-question animate-slide-in-up animate-once">
                            <h3>Are there any costs to my family for organ donation?</h3>
                            <p>No. There are no costs to your family for organ donation. All expenses related to the donation process are covered by the recipient's insurance or the transplant program.</p>
                        </div>
                        <div className="faq-question animate-slide-in-up animate-once">
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
        </section>
    )
}