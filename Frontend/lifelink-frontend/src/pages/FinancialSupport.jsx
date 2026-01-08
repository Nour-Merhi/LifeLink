import { FaHospital } from "react-icons/fa";
import { MdMedication } from "react-icons/md";
import { RiSurgicalMaskFill } from "react-icons/ri";
import { IoMdArrowBack, IoMdArrowForward } from "react-icons/io";
import { MdOutlineKeyboardDoubleArrowLeft, MdOutlineKeyboardDoubleArrowRight } from "react-icons/md";
import { IoPersonCircle } from "react-icons/io5";
import { IoCalendarSharp } from "react-icons/io5";
import { GoClockFill } from "react-icons/go";

import { useState, useEffect } from "react";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";

import Financial_Img from "../assets/imgs/image.png";
import FinancialSupportForm from "../components/donation/FinancialSupportForm";
import ThankModal from "../components/donation/ThankModals/ThankYou";
import api from "../api/axios";
import Patient from "../assets/imgs/patient.jpg";
import "../styles/Dashboard.css";

const API_BASE_URL = "http://localhost:8000";

export default function FinancialSupport() {
  const [thankModal, setThankModal] = useState(false);
  const [formKey, setFormKey] = useState(0);
  const [patientCases, setPatientCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedPatientCaseId, setSelectedPatientCaseId] = useState(null);
  const [selectedPatientName, setSelectedPatientName] = useState(null);

  // Fetch patient cases from backend
  useEffect(() => {
    const fetchPatientCases = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await api.get('/api/patient-cases');
        const cases = response.data.patientCases || [];
        setPatientCases(cases);
      } catch (err) {
        console.error('Error fetching patient cases:', err);
        setError(err.response?.data?.error || 'Failed to load patient cases');
        // Fallback to empty array or default cases if needed
        setPatientCases([]);
      } finally {
        setLoading(false);
      }
    };

    fetchPatientCases();
  }, []);

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
    variableWidth: false,
    adaptiveHeight: true,
    responsive: [
      { breakpoint: 1024, settings: { slidesToShow: 2, variableWidth: false } },
      { breakpoint: 768, settings: { slidesToShow: 1, variableWidth: false } },
    ],
  };

  const handleCloseModal = () => {
    setThankModal(false);
    setFormKey((prev) => prev + 1);
    setSelectedPatientCaseId(null);
    setSelectedPatientName(null);
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
            {loading ? (
              <div style={{ textAlign: 'center', padding: '4rem', color: '#999' }}>
                <p>Loading patient cases...</p>
              </div>
            ) : error ? (
              <div style={{ textAlign: 'center', padding: '4rem', color: '#F12C31' }}>
                <p>{error}</p>
              </div>
            ) : patientCases.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '4rem', color: '#999' }}>
                <p>No active patient cases available at the moment.</p>
              </div>
            ) : (
              <Slider {...settings}
                nextArrow={<NextArrow />}
                prevArrow={<PrevArrow />}          
              >
                {patientCases.map((patient) => {
                const fundingPercentage = Math.round((patient.currentFunding / patient.targetFunding) * 100);
                
                // Construct image URL from backend
                let imageSrc = Patient; // Default fallback
                if (patient.image) {
                  if (patient.image.startsWith('http')) {
                    // Already a full URL
                    imageSrc = patient.image;
                  } else {
                    // Construct full URL from relative path
                    imageSrc = `${API_BASE_URL}/${patient.image}`;
                  }
                }
                
                return (
                  <div key={patient.id} className="patient-container">
                    <div className="patient-case-design" style={{ width: "100%", maxWidth: "350px", margin: "0 auto", padding: "0", overflow: "hidden", borderRadius: "10px" }}>
                      {/* Patient Image */}
                      <div style={{ width: "100%", height: "160px", overflow: "hidden", borderRadius: "10px 10px 0 0", margin: "0", padding: "0" }}>
                        <img 
                          src={imageSrc} 
                          alt={patient.patientName}
                          style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                          onError={(e) => {
                            e.target.src = Patient;
                          }}
                        />
                      </div>
                      
                      <div style={{ padding: "20px" }}>

                      {/* Case Header */}
                      <div className="case-header !mb-0">
                        <div className="case-header-left">
                          <div className="case-patient-info">
                            <h4>{patient.patientName}</h4>
                            <p>{patient.condition} • Age {patient.age}</p>
                          </div>
                        </div>
                      </div>

                        <div className="case-description">
                          <small>
                            {patient.description}
                          </small>
                        </div>
                      {/* Case Stats */}
                      <div className="case-stats !mb-5">
                        <div>
                          <FaHospital />
                          <small>{patient.hospital}</small>
                        </div>
                        
                      </div>

                      {/* Case Body */}
                      <div className="case-body">
                        <div className="progress-case">
                          <div className="funding-info">
                            <span className="funding-label">Progress</span>
                            <span className="funding-amount">
                              ${patient.currentFunding.toLocaleString()} / ${patient.targetFunding.toLocaleString()}
                            </span>
                          </div>

                          <div className="progress-bar">
                            <div 
                              className="progress-fill" 
                              style={{ width: `${fundingPercentage}%` }}
                            ></div>
                          </div>

                          <div className="funding-stats">
                            <span>{fundingPercentage}% funded</span>
                          </div>
                        </div>
                      </div>


                      {/* Support Button */}
                      <div className="case-buttons">
                        <button 
                          className="blue-btn" 
                          type="button"
                          onClick={() => {
                            setSelectedPatientCaseId(patient.id);
                            setSelectedPatientName(patient.patientName);
                            document
                              .getElementById("financial-donor")
                              ?.scrollIntoView({ behavior: "smooth", block: "start" });
                          }}
                        >
                          Support {patient.patientName.split(' ')[0]}
                        </button>
                      </div>
                      </div>
                    </div>
                  </div>
                );
              })}
              </Slider>
            )}
          </div>

        </div>
      </div>

      {/* Financial Support Form */}
      <FinancialSupportForm 
        key={formKey} 
        setModal={setThankModal} 
        selectedPatientCaseId={selectedPatientCaseId}
        selectedPatientName={selectedPatientName}
      />

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
