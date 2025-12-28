import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Donation from "./pages/Donation";
import DonationWelcome from "./components/donation/DonationWelcome.jsx";
import HomeBloodBooking from "./components/donation/HomeBloodBooking.jsx";
import HospitalBloodBooking from "./components/donation/HospitalBloodBooking.jsx";
import HomeBookForm from "./components/donation/HomeBloodForm";
import OrganDead from "./pages/OrganDead";
import OrganAlive from "./pages/OrganAlive";
import FinancialSupport from "./pages/FinancialSupport";
import ScrollToTop from "./components/ScrollToTop";
import AdminDashboard from "./pages/AdminDashboard";
import { QuizProvider } from "./store/quizStore";
import Home from "./pages/Home"

import AfterDeathStepTwo from "./components/donation/afterLifeOrganForm/AfterDeathStepTwo.jsx";
import AfterDeathStepThree from "./components/donation/afterLifeOrganForm/AfterDeathStepThree.jsx";
import AliveOrganForm from "./components/donation/AliveOrganForm";

import { useEffect } from "react";
import Hospitals from "./components/adminDashboard/Hospitals.jsx";
import Donors from "./components/adminDashboard/Donors.jsx";
import DonorDetail from "./components/adminDashboard/donorComponents/DonorDetail.jsx";
import HospitalDetail from "./components/adminDashboard/hospitalComponents/HospitalDetail.jsx";
import PhlebotomistDetail from "./components/adminDashboard/phlebotomistComponents/PhlebotomistDetail.jsx";
import HomeVisit from "./components/adminDashboard/HomeVisit.jsx";
import HospitalAppointments from "./components/adminDashboard/HospitalAppointments.jsx";
import Phlebotomist from "./components/adminDashboard/Phlebotomist.jsx";
import Financial from "./components/adminDashboard/Financial.jsx";
import Notification from "./components/adminDashboard/Notification.jsx";
import OrganPledges from "./components/adminDashboard/OrganPledges.jsx";
import Login from "./pages/Login";
import Register from "./pages/Register"
import axios from "axios";


import ArticlePage from "./pages/articlePage.jsx";
import ArticleDetail from "./pages/ArticleDetail.jsx";
import HospitalDashboardLayout from "./pages/HospitalDashboard/HospitalDashboardLayout";
import HospitalDashboard from "./pages/HospitalDashboard/HospitalDashboard";
import DonorManagement from "./pages/HospitalDashboard/DonorManagement";
import Appointments from "./pages/HospitalDashboard/Appointments";
import UrgentRequests from "./pages/HospitalDashboard/UrgentRequests";
import HomeVisits from "./pages/HospitalDashboard/HomeVisits";
import Phlebotomists from "./pages/HospitalDashboard/Phlebotomists";
import OrganCoordination from "./pages/HospitalDashboard/OrganCoordination";
import Inventory from "./pages/HospitalDashboard/Inventory";
import AnalyticsReports from "./pages/HospitalDashboard/AnalyticsReports";
import NotificationsCenter from "./pages/HospitalDashboard/NotificationsCenter";
import HospitalSettings from "./pages/HospitalDashboard/HospitalSettings";
import QuizHome from "./pages/Quiz/QuizHome";
import QuizQuestion from "./pages/Quiz/QuizQuestion";
import QuizResults from "./pages/Quiz/QuizResults";

import "leaflet/dist/leaflet.css";


function App() {
  useEffect(() => {
    axios
      .get("http://127.0.0.1:8000/api/test")
      .then((res) => {
        console.log(res.data);
      })
      .catch((err) => {
        console.error(err);
      });
  }, []);


  return (
    <>
    <QuizProvider>
    <Router>
      <ScrollToTop />
      
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/home" element={<Home />} />
        
        {/* Donation layout */}
        <Route path="/donation" element={<Donation />}>
          <Route index element={<DonationWelcome />} />
          <Route path="home-blood-donation" element={<HomeBloodBooking pageType="home" />} />
          <Route path="hospital-blood-donation" element={<HospitalBloodBooking pageType="hospital"/>} />
          <Route path="after-death-donation" element={<OrganDead />} />
          <Route path="alive-organ-donation" element={<OrganAlive />} />
          <Route path="financial-support" element={<FinancialSupport />} />
          <Route path="alive-organ-form" element={<AliveOrganForm />} />
          <Route path="after-death-organ-form/stepTwo" element={<AfterDeathStepTwo />} />
          <Route path="after-death-organ-form/stepThree" element={<AfterDeathStepThree />} />
          <Route path="home-blood-from" element={<HomeBookForm />} />
        </Route>
        
        {/* Articles Pages */}
        <Route path="/articles" element={<ArticlePage />} />
        <Route path="/articles/:id" element={<ArticleDetail />} />
        
        {/* Admin Dashboard layout */}
        <Route path="/admin" element={<AdminDashboard />}>
          <Route path="donors" element={<Donors />} />
          <Route path="donors/:donorCode" element={<DonorDetail />} />
          <Route path="hospitals" element={<Hospitals/>} />
          <Route path="hospitals/:hospitalCode" element={<HospitalDetail />} />
          <Route path="home-visits" element={<HomeVisit />} />
          <Route path="hospital-appointments" element={<HospitalAppointments />} />
          <Route path="phlebotomists" element={<Phlebotomist />} />
          <Route path="phlebotomists/:phlebotomistCode" element={<PhlebotomistDetail />} />
          <Route path="organ-pledges" element={<OrganPledges />} />
          <Route path="financials" element={<Financial />} />
          <Route path="notifications" element={<Notification />} />
          <Route path="settings" element={<div><h1>Settings</h1></div>} />
          <Route path="dashboard" element={<div><h1>Dashboard</h1></div>} />
        </Route>
        
        {/* Hospital Dashboard layout */}
        <Route path="/hospital" element={<HospitalDashboardLayout />}>
          <Route path="dashboard" element={<HospitalDashboard />} />
          <Route path="donors" element={<DonorManagement />} />
          <Route path="appointments" element={<Appointments />} />
          <Route path="urgent-requests" element={<UrgentRequests />} />
          <Route path="home-visits" element={<HomeVisits />} />
          <Route path="phlebotomists" element={<Phlebotomists />} />
          <Route path="organ-coordination" element={<OrganCoordination />} />
          <Route path="inventory" element={<Inventory />} />
          <Route path="analytics" element={<AnalyticsReports />} />
          <Route path="notifications" element={<NotificationsCenter />} />
          <Route path="settings" element={<HospitalSettings />} />
        </Route>
        
        {/* Quiz Routes */}
        <Route path="/quiz" element={<QuizHome />} />
        <Route path="/quiz/results" element={<QuizResults />} />
        <Route path="/quiz/:category/question" element={<QuizQuestion />} />
        
        {/* Default redirect */}
        <Route path="/" element={<div>Welcome to LifeLink</div>} />
      </Routes>
    </Router>
    </QuizProvider>
    </>
  );
}

export default App;
