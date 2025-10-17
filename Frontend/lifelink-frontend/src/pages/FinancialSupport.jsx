import { FaHospital } from "react-icons/fa";
import { MdMedication } from "react-icons/md";
import { RiSurgicalMaskFill } from "react-icons/ri";
import { IoMdArrowBack, IoMdArrowForward } from "react-icons/io";
import { MdOutlineKeyboardDoubleArrowLeft, MdOutlineKeyboardDoubleArrowRight } from "react-icons/md";
import ProgressBar from "../components/PorgressBar";
import Patient from "../assets/imgs/patient.jpg"

import { useState } from "react";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";

import Financial_Img from "../assets/imgs/image.png";
import FinancialSupportForm from "../components/donation/FinancialSupportForm";
import ThankModal from "../components/donation/ThankModals/ThankYou";

export default function FinancialSupport() {
  const [thankModal, setThankModal] = useState(false);
  const [formKey, setFormKey] = useState(0);

  const NextArrow = ({ onClick }) => (
    <div
      onClick={onClick}
      style={{
        position: "absolute",
        right: "-34px",
        top: "50%",
        transform: "translateY(-50%)",
        cursor: "pointer",
        zIndex: 10,
      }}
    >
      <MdOutlineKeyboardDoubleArrowRight size={30}  />
    </div>
  );

  const PrevArrow = ({ onClick }) => (
    <div
      onClick={onClick}
      style={{
        position: "absolute",
        left: "-30px",
        top: "50%",
        transform: "translateY(-50%)",
        cursor: "pointer",
        zIndex: 10,
      }}
    >
      <MdOutlineKeyboardDoubleArrowLeft size={30}  />
    </div>
  );


  const settings = {
    dots: true,
    infinite: true,
    slidesToShow: 3,
    slidesToScroll: 1,
    arrows: true,
    centerMode: false,
    variableWidth: true,
    responsive: [
      { breakpoint: 1024, settings: { slidesToShow: 2 } },
      { breakpoint: 768, settings: { slidesToShow: 1 } },
    ],
  };

  const handleCloseModal = () => {
    setThankModal(false);
    setFormKey((prev) => prev + 1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div 
     className="organ"
    style={{
        width: "73.4vw",      
        maxWidth: "100vw",               
        boxSizing: "border-box",
      }}
    >
      {/* Hero Section */}
      <div style={{ width: "100%", position: "relative" }}>
        <div className="donate-support">
          <img src={Financial_Img} alt="doctor and patient image" />
          <div>
            <h1>Save Lives.</h1>
            <h1>Support Patients.</h1>
            <p>
              Your generosity helps patients afford life-saving treatments they
              cannot cover alone.
            </p>
            <button
              className="pledge-btn animate-bounce linear-green"
              onClick={() =>
                document
                  .getElementById("financial-donor")
                  ?.scrollIntoView({ behavior: "smooth", block: "start" })
              }
            >
              Donate Now
            </button>
          </div>
        </div>
      </div>

      {/* Why Support Section */}
      <div className="box-container why-register">
        <h2>Why Your Support Matters</h2>
        <div className="why-reason">
          <p>
            Many patients struggle with the high cost of surgeries, transplants,
            and treatments. With your support, you can directly ease their
            burden and give them a chance at recovery.
          </p>
        </div>
        <div className="organs">
          <div className="organ-card" style={{ flexShrink: 0 }}>
            <div className="organ-icon bg-blue-color">
              <RiSurgicalMaskFill />
            </div>
            <h3>Surgery Costs</h3>
            <p>Helps cover expensive surgical procedures and hospital stays</p>
          </div>

          <div className="organ-card" style={{ flexShrink: 0 }}>
            <div className="organ-icon bg-green-color">
              <MdMedication />
            </div>
            <h3>Essential Medicines</h3>
            <p>Funds critical medications and ongoing treatments</p>
          </div>

          <div className="organ-card" style={{ flexShrink: 0 }}>
            <div className="organ-icon bg-purple-color">
              <FaHospital />
            </div>
            <h3>Hospital Care</h3>
            <p>Supports extended hospital care and specialized treatments</p>
          </div>
        </div>
      </div>

      {/* Donation Process */}
      <div className="box-container donation-process">
        <h2>How Donation Process Works</h2>
        <div className="process-steps">
          <div className="step" style={{ flexShrink: 0 }}>
            <div className="step-number">1</div>
            <h3>Choose Support</h3>
            <p>
              Select a specific patient to help or contribute to our general
              fund for urgent cases
            </p>
          </div>

          <div className="step" style={{ flexShrink: 0 }}>
            <div className="step-number">2</div>
            <h3>Donate Securely</h3>
            <p>
              Choose your donation amount and secure payment method. All
              transactions are encrypted
            </p>
          </div>

          <div className="step" style={{ flexShrink: 0 }}>
            <div className="last-step-number">3</div>
            <h3>Track Impact</h3>
            <p>Receive receipt and updates on how your funds are used to help patients</p>
          </div>
        </div>
      </div>

      {/* Patients Slider */}
      <div>
        <div className="support-patient">
          <div className="top-info">
            <h2>Patients Who Need Your Help</h2>
            <button type="button" className="view-more-btn">
              view more <IoMdArrowForward />
            </button>
          </div>

          <div className="pat-card">
            <Slider {...settings}
              nextArrow={<NextArrow />}
              prevArrow={<PrevArrow />}          
            >
              {[...Array(4)].map((_, i) => (
                  <div key={i} className="patient-container">
                    <div className="patient" >
                      <img src={ Patient } alt="patient image"/>
                      <div className="texts">

                        <div className="text-title">
                            <h3>Ali, 12</h3>
                            <span className="text-red-500">Kidney Transplant</span>
                        </div>

                        <p className="patient-dis">
                            Ali has been on dialysis for more than 2 years and urgently needs a
                            kidney transplant now. His family cannot afford the surgery costs.
                        </p>
                      
                        <ProgressBar goal={1000} raised={346} />
                      </div>

                      <button className="support-patient-btn linear-blue" type="button">Support Ali</button>
                    </div>
                </div>
              ))}
            </Slider>
          </div>

        </div>
      </div>

      {/* Financial Support Form */}
      <FinancialSupportForm key={formKey} setModal={setThankModal} />

      {/* FAQ Section */}
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
            </div> <div className="faq-question"> 
                <h3>Can I specify which organs to donate?</h3> 
                <p>Yes. You can choose to donate specific organs or tissues according to your preferences.</p>
           </div>
        </div>
      </div>

      {/* Data Privacy */}
      <div className="data-privacy">
        <p>
          All your information is kept confidential and shared only with
          partner hospitals for evaluation purposes. We use industry-standard
          encryption to protect your data and comply with all medical privacy
          regulations.
        </p>
      </div>

      {thankModal && <ThankModal onClose={handleCloseModal} />}
    </div>
  );
}
