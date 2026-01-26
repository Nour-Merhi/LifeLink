import { FaHeart } from "react-icons/fa";

export default function Leaderboard({ leaderboardData }) {
    return (
        <div className="leaderboard-content">
            <table className="leaderboard-table">
                <thead>
                    <tr>
                        <th>Rank</th>
                        <th>Top Players</th>
                        <th>Scores</th>
                        <th className="!max-w-[5px] !pl-0"></th>
                    </tr>
                </thead>
                <tbody>
                    {leaderboardData.map((player) => (
                        <tr key={player.rank} className="game-leaderboard-row">
                            <td className="leaderboard-rank">
                                {player.rank}
                                {player.rank === 1 && "st"}
                                {player.rank === 2 && "nd"}
                                {player.rank === 3 && "rd"}
                                {player.rank > 3 && "th"}
                            </td>
                            <td>
                                <div className="leaderboard-player">
                                    <div className="player-avatar">
                                        <span>👤</span>
                                    </div>
                                    <div className="player-info">
                                        <span className="player-name">{player.name}</span>
                                        <span className="player-blood-type">Blood Type {player.bloodType}</span>
                                    </div>
                                </div>
                            </td>
                            <td className="leaderboard-score">{player.score.toLocaleString()} XP</td>
                            <td className="!max-w-[5px] !pl-0">
                                <div className="text-red-600 rounded-full p-3 max-w-[40px] max-h-[40px] bg-red-100">
                                 <FaHeart className="text-red-500 "/>
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    )
}