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

import AfterDeathStepTwo from "./components/donation/afterLifeOrganForm/AfterDeathStepTwo.jsx";
import AfterDeathStepThree from "./components/donation/afterLifeOrganForm/AfterDeathStepThree.jsx";
import AliveOrganForm from "./components/donation/AliveOrganForm";

import { useEffect } from "react";
import axios from "axios";

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
    <Router>
      <ScrollToTop />
      
      <Routes>
        {/* Donation layout */}
        <Route path="/donation" element={<Donation />}>
          <Route index element={<DonationWelcome />} />
          <Route path="home-blood-donation" element={<HomeBloodBooking pageType="home" />} />
          <Route path="hospital-blood-donation" element={<HospitalBloodBooking pageType="hospital"/>} />
          <Route path="/donation/after-death-donation" element={<OrganDead />} />
          <Route path="/donation/alive-organ-donation" element={<OrganAlive />} />
          <Route path="/donation/financial-support" element={<FinancialSupport />} />

          <Route path="/donation/alive-organ-form" element={<AliveOrganForm />} />
          <Route path="/donation/after-death-organ-form/stepTwo" element={<AfterDeathStepTwo />} />
          <Route path="/donation/after-death-organ-form/stepThree" element={<AfterDeathStepThree />} />
          <Route path="/donation/home-blood-from" element={<HomeBookForm />} />
        </Route>
        
      </Routes>
    </Router>

    </>
  );
}

export default App;
