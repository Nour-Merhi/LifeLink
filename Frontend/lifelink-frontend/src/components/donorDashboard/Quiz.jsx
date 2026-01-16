import { useState, useEffect } from "react";
import { IoMdCheckmark } from "react-icons/io";
import { RiLock2Fill } from "react-icons/ri";
import { FaTrophy, FaChartLine, FaGamepad } from "react-icons/fa";
import { AiFillThunderbolt } from "react-icons/ai";
import api from "../../api/axios";
import "../../styles/Dashboard.css";

export default function Quiz() {
    const [quizData, setQuizData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const fetchQuizData = async () => {
            try {
                setLoading(true);
                setError("");
                const response = await api.get("/api/quiz/history");
                setQuizData(response.data);
            } catch (err) {
                console.error("Error fetching quiz data:", err);
                setError(err.response?.data?.message || "Failed to load quiz data");
            } finally {
                setLoading(false);
            }
        };

        fetchQuizData();
    }, []);

    if (loading) {
        return (
            <section className="donor-section">
                <div className="flex items-center justify-center h-64">
                    <p className="text-gray-500">Loading quiz data...</p>
                </div>
            </section>
        );
    }

    if (error) {
        return (
            <section className="donor-section">
                <div className="flex items-center justify-center h-64">
                    <p className="text-red-500">Error: {error}</p>
                </div>
            </section>
        );
    }

    if (!quizData) {
        return (
            <section className="donor-section">
                <div className="flex items-center justify-center h-64">
                    <p className="text-gray-500">No quiz data available</p>
                </div>
            </section>
        );
    }

    const { current_level, completed_levels, progress_percentage, total_xp, xp_until_next_level, session_logs, minigame_stats = {}, minigame_logs = [] } = quizData;
    const totalLevels = 10;

    // Format game type name for display
    const formatGameType = (gameType) => {
        const names = {
            'tictactoe': 'Tic Tac Toe',
            'hangman': 'Hangman',
            'memory': 'Memory Game'
        };
        return names[gameType] || gameType.charAt(0).toUpperCase() + gameType.slice(1);
    };

    return (
        <section className="donor-section">
            <div className="dashboard-title">
                <div>
                    <div className="icon-title">
                        <FaGamepad />
                        <h2 className="!text-2xl !font-bold">Quiz Progress</h2>
                    </div>
                    <p className="text-gray-500 !text-lg">Track your quiz performance and level progress</p>
                </div>
            </div>

            {/* Current Level & Progress */}
            <div className="donor-container p-6 mb-6">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-800">Level {current_level}</h2>
                        <p className="text-gray-600">Current Game Level</p>
                    </div>
                    <div className="text-right">
                        <div className="text-3xl font-bold text-purple-600">{total_xp}</div>
                        <div className="text-sm text-gray-600">Total XP</div>
                    </div>
                </div>

                {/* Progress Bar */}
                <div className="mb-4">
                    <div className="flex justify-between text-sm text-gray-600 mb-2">
                        <span>Progress to Level {current_level + 1}</span>
                        <span>{progress_percentage.toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-4">
                        <div
                            className="bg-purple-600 h-4 rounded-full transition-all duration-300"
                            style={{ width: `${progress_percentage}%` }}
                        ></div>
                    </div>
                    <p className="text-sm text-gray-500 mt-2">{xp_until_next_level} XP until next level</p>
                </div>
            </div>

            {/* Levels Overview */}
            <div className="donor-container p-6 mb-6">
                <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <FaTrophy className="text-yellow-500" />
                    Completed Levels
                </h2>
                <div className="grid grid-cols-5 gap-4">
                    {Array.from({ length: totalLevels }, (_, i) => {
                        const level = i + 1;
                        const isCompleted = completed_levels.includes(level);
                        const isCurrent = level === current_level;
                        
                        return (
                            <div
                                key={level}
                                className={`p-4 rounded-lg border-2 text-center ${
                                    isCompleted
                                        ? 'bg-green-50 border-green-500'
                                        : isCurrent
                                        ? 'bg-purple-50 border-purple-500'
                                        : 'bg-gray-50 border-gray-300'
                                }`}
                            >
                                <div className="text-2xl mb-2">
                                    {isCompleted ? (
                                        <IoMdCheckmark className="text-green-600 mx-auto" />
                                    ) : (
                                        <RiLock2Fill className="text-gray-400 mx-auto" />
                                    )}
                                </div>
                                <div className={`font-bold ${isCompleted ? 'text-green-700' : isCurrent ? 'text-purple-700' : 'text-gray-500'}`}>
                                    Level {level}
                                </div>
                                {isCurrent && !isCompleted && (
                                    <div className="text-xs text-purple-600 mt-1">In Progress</div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Minigame Statistics */}
            {Object.keys(minigame_stats).length >= 0 && (
                <div className="donor-container p-6 mb-6">
                    <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                        <FaGamepad className="text-purple-500" />
                        Minigame Statistics
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {Object.entries(minigame_stats).map(([gameType, stats]) => (
                            <div
                                key={gameType}
                                className={`p-4 rounded-lg border-2 ${
                                    stats.unlocked
                                        ? 'bg-purple-50 border-purple-500'
                                        : 'bg-gray-50 border-gray-300 opacity-60'
                                }`}
                            >
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-2">
                                        <AiFillThunderbolt className={`text-xl ${stats.unlocked ? 'text-purple-600' : 'text-gray-400'}`} />
                                        <h3 className="font-bold text-gray-800">{formatGameType(gameType)}</h3>
                                    </div>
                                    {!stats.unlocked && (
                                        <RiLock2Fill className="text-gray-400" />
                                    )}
                                </div>
                                {stats.unlocked ? (
                                    <div className="space-y-2 text-sm">
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Total Plays:</span>
                                            <span className="font-semibold">{stats.total_plays}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Wins:</span>
                                            <span className="font-semibold text-green-600">{stats.wins}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Losses:</span>
                                            <span className="font-semibold text-red-600">{stats.losses}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Win Rate:</span>
                                            <span className="font-semibold">{stats.win_rate}%</span>
                                        </div>
                                        <div className="flex justify-between border-t pt-2 mt-2">
                                            <span className="text-gray-600">Total XP:</span>
                                            <span className="font-semibold text-blue-600">+{stats.total_xp} XP</span>
                                        </div>
                                    </div>
                                ) : (
                                    <p className="text-sm text-gray-500">Locked - Complete more quiz levels to unlock</p>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Minigame History */}
            {minigame_logs.length > 0 && (
                <div className="donor-container p-6 mb-6">
                    <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                        <AiFillThunderbolt className="text-purple-500" />
                        Minigame History
                    </h2>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b-2 border-gray-200">
                                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Date</th>
                                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Game</th>
                                    <th className="text-center py-3 px-4 font-semibold text-gray-700">Plays</th>
                                    <th className="text-center py-3 px-4 font-semibold text-gray-700">Wins</th>
                                    <th className="text-right py-3 px-4 font-semibold text-gray-700">XP Earned</th>
                                </tr>
                            </thead>
                            <tbody>
                                {minigame_logs.map((log, index) => (
                                    <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                                        <td className="py-3 px-4 text-gray-700">
                                            {new Date(log.created_at).toLocaleDateString('en-US', {
                                                year: 'numeric',
                                                month: 'short',
                                                day: 'numeric',
                                                hour: '2-digit',
                                                minute: '2-digit'
                                            })}
                                        </td>
                                        <td className="py-3 px-4">
                                            <span className="inline-block bg-purple-100 text-purple-700 px-3 py-1 rounded-full font-semibold">
                                                {formatGameType(log.game_type)}
                                            </span>
                                        </td>
                                        <td className="py-3 px-4 text-center">
                                            <span className="text-gray-700 font-semibold">{log.plays}</span>
                                        </td>
                                        <td className="py-3 px-4 text-center">
                                            <span className="text-green-600 font-semibold">{log.wins}</span>
                                        </td>
                                        <td className="py-3 px-4 text-right">
                                            <span className="text-blue-600 font-semibold">+{log.xp_earned} XP</span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Session Logs */}
            <div className="donor-container p-6">
                <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <FaChartLine className="text-blue-500" />
                    Quiz History
                </h2>
                {session_logs && session_logs.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b-2 border-gray-200">
                                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Date</th>
                                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Level</th>
                                    <th className="text-center py-3 px-4 font-semibold text-gray-700">Correct</th>
                                    <th className="text-center py-3 px-4 font-semibold text-gray-700">Wrong</th>
                                    <th className="text-right py-3 px-4 font-semibold text-gray-700">XP Earned</th>
                                </tr>
                            </thead>
                            <tbody>
                                {session_logs.map((log, index) => (
                                    <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                                        <td className="py-3 px-4 text-gray-700">
                                            {new Date(log.created_at).toLocaleDateString('en-US', {
                                                year: 'numeric',
                                                month: 'short',
                                                day: 'numeric',
                                                hour: '2-digit',
                                                minute: '2-digit'
                                            })}
                                        </td>
                                        <td className="py-3 px-4">
                                            <span className="inline-block bg-purple-100 text-purple-700 px-3 py-1 rounded-full font-semibold">
                                                Level {log.level}
                                            </span>
                                        </td>
                                        <td className="py-3 px-4 text-center">
                                            <span className="text-green-600 font-semibold">{log.correct_answers}</span>
                                        </td>
                                        <td className="py-3 px-4 text-center">
                                            <span className="text-red-600 font-semibold">{log.wrong_answers}</span>
                                        </td>
                                        <td className="py-3 px-4 text-right">
                                            <span className="text-blue-600 font-semibold">+{log.total_xp} XP</span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="text-center py-8 text-gray-500">
                        <p>No quiz history yet. Start playing to see your progress!</p>
                    </div>
                )}
            </div>
        </section>
    );
}
