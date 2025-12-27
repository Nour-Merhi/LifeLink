import { FaTint, FaHeart } from "react-icons/fa";

const stats = [
  { label: "Total Donations" },
  { label: "Active Donors" },
  { label: "Lives Saved" },
];

const fakeUsers = [
  { id: 1, name: "Sarah Johansson", bloodType: "O+", donations: 78, lastDonated: "Jan 15, 2025", daysAgo: 567 },
  { id: 2, name: "John Doe", bloodType: "A+", donations: 50, lastDonated: "Feb 10, 2025", daysAgo: 520 },
  { id: 3, name: "Jane Smith", bloodType: "B-", donations: 45, lastDonated: "Mar 05, 2025", daysAgo: 480 },
  { id: 4, name: "Michael Lee", bloodType: "AB+", donations: 30, lastDonated: "Apr 20, 2025", daysAgo: 420 },
  { id: 5, name: "Emily Clark", bloodType: "O-", donations: 25, lastDonated: "May 18, 2025", daysAgo: 380 }
];

export default function BloodDonationStatsAndLeaderboard() {
  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Three Stats boxes */}
      <div className="flex justify-center gap-6 mb-12">
                  {stats.map((stat, idx) => (
                    <div
                      key={idx}
                      className="bg-white shadow-md rounded-lg flex items-center px-8 py-6 min-w-[180px]"
                    >
                      <span className="text-red-500 text-xl mr-2">
                        <FaTint />
                      </span>
                      <span className="text-gray-700 font-semibold">{stat.label}</span>
                    </div>
                  ))}
                  </div>

      {/* Leaderboard table */}
      
      <div className="relative transparent rounded-2xl p-6 shadow-lg">
        <h2 className="bg-gradient-to-r from-red-700 to-red-600 text-white font-semibold p-3 rounded-t-lg text-lg">
  Top Blood Donors Leaderboard
</h2>

        <div className="pt-4 space-y-3">
          {fakeUsers.map((user, index) => (
            <div
              key={user.id}
              className="bg-white rounded-lg flex items-center justify-between p-4 shadow-sm"
            >
              <div className="flex items-center space-x-3">
                <div className="text-gray-600 bg-gray-300 rounded-full w-10 h-10 flex items-center justify-center font-semibold">
                  {index + 1}
                </div>
                <div>
                  <div className="font-semibold">{user.name}</div>
                  <div className="text-sm text-gray-500 flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-red-600" />
                    Blood type {user.bloodType}
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-6 text-sm text-gray-600">
                <div>
                  <div className="font-semibold">{user.donations}</div>
                  Donations
                </div>
                <div className="text-right">
                  <div className="font-semibold">{user.lastDonated}</div>
                  <div className="text-xs">{user.daysAgo} days ago</div>
                </div>
                <div className="text-red-600">
                  <FaHeart />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  
  );
}

