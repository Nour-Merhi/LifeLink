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
import AdminDashboard from "./pages/Dashboards/AdminDashboard";
import { QuizProvider } from "./store/quizStore";
import Home from "./pages/Home";
import ProtectedRoute from "./components/ProtectedRoute";

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
import Articles from "./components/adminDashboard/Articles.jsx";
import AdminSettings from "./components/adminDashboard/Settings.jsx";
import AdminProfile from "./components/adminDashboard/AdminProfile.jsx";
import Login from "./pages/Login";
import Register from "./pages/Register"
import axios from "axios";

/* Articles */
import ArticlePage from "./pages/articlePage.jsx";
import ArticleDetail from "./pages/ArticleDetail.jsx";

/* Hospital Dashboard */
import HospitalDashboardLayout from "./pages/Dashboards/HospitalDashboardLayout.jsx";
import HospitalDashboard from "./components/HospitalDashboard/HospitalDashboard.jsx";
import DonorManagement from "./components/HospitalDashboard/DonorManagement.jsx";
import Appointments from "./components/HospitalDashboard/Appointments.jsx";
import UrgentRequests from "./components/HospitalDashboard/UrgentRequests.jsx";
import HomeVisits from "./components/HospitalDashboard/HomeVisits.jsx";
import Phlebotomists from "./components/HospitalDashboard/Phlebotomists.jsx";
import OrganCoordination from "./components/HospitalDashboard/OrganCoordination.jsx";
import Inventory from "./components/HospitalDashboard/Inventory.jsx";
import AnalyticsReports from "./components/HospitalDashboard/AnalyticsReports.jsx";
import NotificationsCenter from "./components/HospitalDashboard/NotificationsCenter.jsx";
import HospitalSettings from "./components/HospitalDashboard/HospitalSettings.jsx";
import HospitalApp from "./components/HospitalDashboard/HospitalApp.jsx";

/* Donor Dashboard layout */
import DonorDashboard from "./pages/Dashboards/DonorDashboard";
import DonorHome from "./components/donorDashboard/home.jsx";
import MyDonations from "./components/donorDashboard/myDonatioins.jsx";
import MyAppointments from "./components/donorDashboard/myAppointments.jsx";
import Settings from "./components/donorDashboard/Settings.jsx";
import Rewards from "./components/donorDashboard/Rewards.jsx";
import Quiz from "./components/donorDashboard/Quiz.jsx";
/* Support */
import Support from "./pages/Support";
import AskQuestion from "./pages/AskQuestion";
/* End of Donor Dashboard */

/* Nurse Dashboard */
import NurseDashboard from "./pages/Dashboards/NurseDashboard";
import NurseHome from "./components/nurseDashboard/Home.jsx";
import NurseAppointments from "./components/nurseDashboard/myAppointments.jsx";
import DonorRequests from "./components/nurseDashboard/DonorRequests.jsx";
import HospitalInfo from "./components/nurseDashboard/HospitalInfo.jsx";
import ManagerContact from "./components/nurseDashboard/ManagerContact.jsx";
import NurseLeaderboard from "./components/nurseDashboard/Leaderboard.jsx";
/* End of Nurse Dashboard */

/* Quizzlit */
import QuizzlitWelcome from "./pages/QuizzlitWelcome";
import QuizReady from "./pages/QuizReady";
import QuizSummary from "./components/Quizzlit/QuizSummary.jsx";
import GameInterface from "./components/Quizzlit/GameInterface.jsx";
/* End of Quizzlit */

/* Find More Hospitals */
import FindMoreHospitals from "./pages/FindMoreHospitals";
import HospitalDetailHome from "./pages/HospitalDetail";
/* End of Find More Hospitals */

import "leaflet/dist/leaflet.css";
import HumanBody from "./pages/HumanBody.jsx";

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
        <Route path="/human-body" element={<HumanBody />} />
        
        {/* Donation layout */}
        <Route path="/donation" element={<Donation />}>
          <Route index element={<DonationWelcome />} />
          <Route path="home-blood-donation" element={<ProtectedRoute><HomeBloodBooking pageType="home" /></ProtectedRoute>} />
          <Route path="hospital-blood-donation" element={<ProtectedRoute><HospitalBloodBooking pageType="hospital"/></ProtectedRoute>} />
          <Route path="after-death-donation" element={<ProtectedRoute><OrganDead /></ProtectedRoute>} />
          <Route path="alive-organ-donation" element={<ProtectedRoute><OrganAlive /></ProtectedRoute>} />
          <Route path="financial-support" element={<ProtectedRoute><FinancialSupport /></ProtectedRoute>} />
          <Route path="alive-organ-form" element={<ProtectedRoute><AliveOrganForm /></ProtectedRoute>} />
          <Route path="after-death-organ-form/stepTwo" element={<ProtectedRoute><AfterDeathStepTwo /></ProtectedRoute>} />
          <Route path="after-death-organ-form/stepThree" element={<ProtectedRoute><AfterDeathStepThree /></ProtectedRoute>} />
          <Route path="home-blood-form" element={<ProtectedRoute><HomeBookForm pageType="home" /></ProtectedRoute>} />
          <Route path="hospital-blood-form" element={<ProtectedRoute><HomeBookForm pageType="hospital" /></ProtectedRoute>} />
        </Route>
        
        {/* Articles Pages */}
        <Route path="/articles" element={<ArticlePage />} />
        <Route path="/articles/:id" element={<ArticleDetail />} />
        
        {/* Admin Dashboard layout */}
        <Route path="/admin" element={<AdminDashboard />}>
          <Route index element={<div className="admin-content"><h1>Admin Dashboard</h1><p>Select an option from the sidebar</p></div>} />
          <Route path="dashboard" element={<div className="admin-content"><h1>Admin Dashboard</h1><p>Select an option from the sidebar</p></div>} />
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
          <Route path="articles" element={<Articles />} />
          <Route path="platform-settings" element={<AdminSettings />} />
          <Route path="profile" element={<AdminProfile />} />
        </Route>
        
        {/* Hospital Dashboard layout */}
        <Route path="/hospital" element={<HospitalDashboardLayout />}>
          <Route index element={<HospitalDashboard />} />
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
          <Route path="hospital-app" element={<HospitalApp />} />
        </Route>
        
        {/* Donor Dashboard layout */}
        <Route path="/donor" element={<DonorDashboard />}>
          <Route index element={<DonorHome />} />
          <Route path="home" element={<DonorHome />} />
          <Route path="my-donations" element={<MyDonations />} />
          <Route path="my-appointments" element={<MyAppointments />} />
          <Route path="rewards" element={<Rewards />} />
          <Route path="quiz" element={<Quiz />} />
          <Route path="settings" element={<Settings />} />
        </Route>

        {/* Nurse Dashboard layout */}
        <Route path="/nurse" element={<NurseDashboard />}>
          <Route index element={<NurseHome />} />
          <Route path="home" element={<NurseHome />} />
          <Route path="my-appointments" element={<NurseAppointments />} />
          <Route path="donor-requests" element={<DonorRequests />} />
          <Route path="hospital-info" element={<HospitalInfo />} />
          <Route path="manager-contact" element={<ManagerContact />} />
          <Route path="leaderboard" element={<NurseLeaderboard />} />
          <Route path="settings" element={<Settings />} />
        </Route>


        {/* Quizlet Routes */}
        <Route path="/quizlit/ready" element={<QuizReady />} />
        <Route path="/quizlit/welcome" element={<QuizzlitWelcome />} />
        <Route path="/quizlit/game-interface" element={<GameInterface />} />
        <Route path="/quizlit/summary" element={<QuizSummary />} />
        
        {/* Support Page */}
        <Route path="/support" element={<Support />} />
        
        {/* Ask Question Page */}
        <Route path="/ask-question" element={<AskQuestion />} />
        
        {/* Find More Hospitals Page */}
        <Route path="/hospitals" element={<FindMoreHospitals />} />
        <Route path="/hospitals/:id" element={<HospitalDetailHome />} />
        
        {/* Default redirect */}
        <Route path="/" element={<Home />} />
      </Routes>
    </Router>
    </QuizProvider>
    </>
  );
}

export default App;
