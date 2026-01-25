import { useState, useEffect } from "react";
import { FaTint, FaHeart, FaUsers } from "react-icons/fa";
import { FaDroplet } from "react-icons/fa6";
import api from "../../api/axios";
import heroes from "../../assets/illustrations/hero.svg";
import AnimatedSection from "../common/AnimatedSection";

export default function BloodDonationStatsAndLeaderboard() {
  const [topDonors, setTopDonors] = useState([]);
  const [stats, setStats] = useState({
    totalDonations: 0,
    activeDonors: 0,
    livesSaved: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchTopDonors = async () => {
      try {
        setLoading(true);
        setError("");
        const response = await api.get('/api/blood-heroes');
        setTopDonors(response.data.topDonors || []);
        setStats(response.data.stats || {
          totalDonations: 0,
          activeDonors: 0,
          livesSaved: 0,
        });
      } catch (err) {
        console.error('Error fetching top blood donors:', err);
        setError('Failed to load top blood donors');
        setTopDonors([]);
      } finally {
        setLoading(false);
      }
    };

    fetchTopDonors();
  }, []);

  const statsList = [
    { label: "Total Donations", value: stats.totalDonations, icon: <FaDroplet />, iconClass: "text-white" },
    { label: "Active Donors", value: stats.activeDonors, icon: <FaUsers />, iconClass: "text-white" },
    { label: "Lives Saved", value: stats.livesSaved, icon: <FaHeart />, iconClass: "text-white" },
  ];

  return (
    <AnimatedSection as="div" className="max-w-[900px] mx-auto px-4 sm:px-6 py-6 relative" animation="fade-up">
      {/* Heroes image - positioned behind the table */}
      <div className="absolute inset-0 flex items-center justify-center z-0 opacity-40 pointer-events-none">
        <img src={heroes} alt="heroes" className="w-full max-w-[760px] h-auto" />
      </div>

      {/* Three Stats boxes */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8 relative z-10">
        {statsList.map((stat, idx) => (
          <div
            key={idx}
            className="bg-white rounded-[18px] flex flex-row gap-3 justify-flex-start items-center p-4 w-full"
            style={{ boxShadow: "0 0 4px 0 rgba(0, 0, 0, 0.25)" }}
          >
            <span className={`${stat.iconClass || "text-red-500"} text-xl mr-2`} style={{ backgroundColor: "#f12c31", borderRadius: "10px", padding: "10px" }}>
              {stat.icon}
            </span>
            <div className="flex flex-col">
              <span className=" font-bold text-lg">{stat.value.toLocaleString()}</span>
              <span className="text-gray-700 font-semibold">{stat.label}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Leaderboard table */}
      <div className="relative z-10">
        <h2 className="bg-gradient-to-r from-red-700 to-red-600 text-white font-semibold p-4 rounded-t-[18px] text-lg text-center sm:text-2xl sm:text-left">
          Top Blood Donors Leaderboard
        </h2>
      </div>
      <div className="relative z-10 rounded-b-[18px] px-6 py-4 shadow-lg bg-white/40">
        {loading ? (
          <div className="text-center py-8">
            <p className="text-gray-600">Loading top donors...</p>
          </div>
        ) : error ? (
          <div className="text-center py-8">
            <p className="text-red-600">{error}</p>
          </div>
        ) : topDonors.length > 0 ? (
          <div className="pt-4 space-y-3">
            {topDonors.map((user, index) => (
              <div
                key={user.id}
                className="bg-white rounded-lg flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 shadow-sm"
              >
                <div className="flex items-center space-x-3 ">
                  <div className="text-gray-600 bg-gray-300 rounded-full w-10 h-10 flex items-center justify-center font-semibold">
                    {index + 1}
                  </div>
                  <div>
                    <div className="font-semibold">{user.name}</div>
                    <div className="text-sm text-gray-500 flex items-center gap-1">
                      Blood type {user.bloodType}
                    </div>
                  </div>
                </div>
                <div className="flex flex-wrap items-center justify-between sm:justify-end gap-4 text-sm text-gray-600 w-full sm:w-auto">
                  <div>
                    <div className="font-semibold text-red-500 text-lg">{user.donations}</div>
                    <div className="text-xs">Donations</div>
                  </div>
                  {user.lastDonated && (
                    <div className="text-left sm:text-right">
                      <div className="font-semibold">{user.lastDonated}</div>
                      {user.daysAgo !== null && (
                        <div className="text-xs">{user.daysAgo} days ago</div>
                      )}
                    </div>
                  )}
                  <div className="text-red-600 rounded-full p-3 bg-red-100">
                    <FaHeart className="text-red-500" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-600">No top donors found at the moment.</p>
          </div>
        )}
      </div>
    </AnimatedSection>
  );
}
