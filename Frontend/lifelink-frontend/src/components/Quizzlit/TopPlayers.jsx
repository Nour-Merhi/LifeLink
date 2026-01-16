import { forwardRef, useState, useEffect } from "react";
import { FaTint, FaHeart } from "react-icons/fa";
import api from "../../api/axios";
import heroes from "../../assets/illustrations/hero.svg";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";

const stats = [
  { label: "Total Donations" },
  { label: "Active Donors" },
  { label: "Lives Saved" },
];

const TopPlayers = forwardRef(function TopPlayers(props, ref) {
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTopPlayers = async () => {
      try {
        setLoading(true);
        const response = await api.get('/api/quiz/leaderboard', {
          params: { limit: 7 } // Get top 7 players for welcome page
        });
        setPlayers(response.data);
      } catch (err) {
        console.error('Error fetching top players:', err);
        setPlayers([]);
      } finally {
        setLoading(false);
      }
    };

    fetchTopPlayers();
  }, []);
  return (
    <section ref={ref} className="mt-20 pt-20 text-center px-6 ">
        <h2 className="text-[48px] font-bold text-white mb-2">
          Top Donor Players
        </h2>
        <p className="text-white max-w-3xl mx-auto">
            Honoring our champions who make a difference through their learning process and inspire others to learn
        </p>

        <div className="max-w-[870px] mx-auto p-6 relative">
        {/* Heroes image - positioned behind the table */}
        <div className="absolute inset-0 flex items-center justify-center z-0 opacity-50 mt-25">
            <img src={heroes} alt="heroes" className="max-w-full h-full" />
        </div>

           
        {/* Leaderboard table */}
        <div className="relative z-10 mt-10">
            <h2 className="bg-gradient-to-r from-red-700 to-red-600 text-white font-semibold p-4 rounded-t-lg text-2xl">
            Top Players Leaderboard
            </h2>
        </div>

        <div className="relative z-10 rounded-b-2xl px-6 py-4 shadow-lg bg-white/70">

            <div className="pt-4 space-y-3">
            {loading ? (
                <div className="text-center py-8 text-gray-600">Loading leaderboard...</div>
            ) : players.length === 0 ? (
                <div className="text-center py-8 text-gray-600">No players yet. Be the first!</div>
            ) : (
                players.map((player, index) => {
                    // Calculate level from XP (simplified calculation - matches backend logic)
                    const calculateLevel = (totalXp) => {
                        let level = 1;
                        while (true) {
                            const requiredXp = 50 * Math.pow(level, 2) + 50 * level;
                            if (totalXp < requiredXp) {
                                return level;
                            }
                            level++;
                        }
                    };

                    const playerLevel = calculateLevel(player.score);

                    return (
                        <div
                            key={player.rank}
                            className="bg-white rounded-lg flex items-center justify-between p-4 shadow-sm"
                        >
                            <div className="flex items-center space-x-3">
                                <div className="text-gray-600 bg-gray-300 rounded-full w-10 h-10 flex items-center justify-center font-semibold">
                                    {player.rank}
                                </div>
                                <div>
                                    <div className="font-semibold text-left">{player.name}</div>
                                    <div className="text-sm text-gray-500 flex items-center gap-1">
                                        Level {playerLevel} -
                                        Blood type {player.bloodType}
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center space-x-6 text-sm text-gray-600">
                                <div>
                                    <div className="font-semibold text-purple-800 text-lg">{player.score.toLocaleString()}</div>
                                    <div className="text-xs">XP</div>
                                </div>
                                <div className="text-red-600 rounded-full p-3 bg-red-100">
                                    <FaHeart className="text-red-500 "/>
                                </div>
                            </div>
                        </div>
                    );
                })
            )}
            </div>
        </div>
        </div>
    </section>
  );
});

export default TopPlayers;