import { useEffect, useMemo, useState } from "react";
import { FaTrophy, FaStar, FaMedal } from "react-icons/fa";
import api from "../../api/axios";
import "../../styles/Dashboard.css";

function Stars({ value = 0 }) {
    const v = Number(value) || 0;
    return (
        <span style={{ display: "inline-flex", gap: "4px", alignItems: "center" }}>
            {Array.from({ length: 5 }, (_, i) => (
                <FaStar
                    key={i}
                    style={{ fontSize: "14px", color: i < Math.round(v) ? "#F5B301" : "#D1D5DB" }}
                />
            ))}
            <span className="muted" style={{ marginLeft: "6px" }}>
                {v.toFixed(2)}
            </span>
        </span>
    );
}

function getInitials(name = "") {
    const parts = String(name).trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return "NA";
    const first = parts[0]?.[0] || "";
    const last = parts.length > 1 ? (parts[parts.length - 1]?.[0] || "") : "";
    return (first + last).toUpperCase();
}

function Avatar({ name, rank }) {
    const initials = getInitials(name);
    return (
        <div className={`lb-avatar ${rank <= 3 ? "lb-avatar-top" : ""}`}>
            {rank <= 3 && <div className="lb-crown">👑</div>}
            <div className="lb-avatar-circle">{initials}</div>
            <div className={`lb-rank-badge lb-rank-${rank}`}>{rank}</div>
        </div>
    );
}

export default function Leaderboard() {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [activeTab, setActiveTab] = useState("raters"); // 'raters' | 'workers'
    const [topRaters, setTopRaters] = useState([]);
    const [topWorkers, setTopWorkers] = useState([]);
    const [myStats, setMyStats] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                setError("");
                const res = await api.get("/api/nurse/leaderboard");
                setTopRaters(res.data?.top_raters || []);
                setTopWorkers(res.data?.top_workers || []);
                setMyStats(res.data?.my_stats || null);
            } catch (err) {
                console.error("Error fetching leaderboard:", err);
                setError(err.response?.data?.message || err.message || "Failed to load leaderboard");
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const data = activeTab === "workers" ? topWorkers : topRaters;
    const top3 = useMemo(() => data.slice(0, 3), [data]);
    const rest = useMemo(() => data.slice(3), [data]);

    const myRank = activeTab === "workers" ? myStats?.top_workers?.rank : myStats?.top_raters?.rank;
    const myScorePrimary = activeTab === "workers"
        ? (myStats?.top_workers?.completed_count ?? 0)
        : Number(myStats?.top_raters?.avg_rating ?? 0);
    const myScoreSecondary = activeTab === "workers"
        ? (myStats?.top_workers?.ratings_count ?? 0)
        : (myStats?.top_raters?.ratings_count ?? 0);

    if (loading) {
        return (
            <div className="loader">
                <h3>Loading Leaderboard...</h3>
            </div>
        );
    }

    if (error) {
        return (
            <div style={{ textAlign: "center", padding: "40px", color: "#F12C31" }}>
                <p>Error: {error}</p>
            </div>
        );
    }

    return (
        <section className="home-visit-section">
            <div className="leaderboard-shell">
                <div className="leaderboard-card">
                    <div className="leaderboard-header">
                        <div className="leaderboard-title">
                            <FaTrophy className="leaderboard-title-icon" />
                            <h2>Leaderboard</h2>
                        </div>
                        <p className="leaderboard-subtitle">
                            {activeTab === "raters"
                                ? "Top rated nurses based on donor ratings for completed home appointments"
                                : "Top workers based on completed home appointments"}
                        </p>
                    </div>

                    <div className="leaderboard-tabs">
                        <button
                            className={`leaderboard-tab ${activeTab === "raters" ? "active" : ""}`}
                            onClick={() => setActiveTab("raters")}
                            type="button"
                        >
                            Top Raters
                        </button>
                        <button
                            className={`leaderboard-tab ${activeTab === "workers" ? "active" : ""}`}
                            onClick={() => setActiveTab("workers")}
                            type="button"
                        >
                            Top Workers
                        </button>
                    </div>

                    {/* Podium */}
                    <div className="leaderboard-podium">
                        {top3.length > 0 ? (
                            top3.map((p) => (
                                <div key={p.phlebotomist_id} className={`leaderboard-podium-item rank-${p.rank}`}>
                                    <Avatar name={p.name} rank={p.rank} />
                                    <div className="leaderboard-podium-name" title={p.name}>{p.name}</div>
                                    <div className="leaderboard-podium-meta">
                                        {activeTab === "raters" ? (
                                            <>
                                                <Stars value={p.avg_rating} />
                                                <span className="muted">· {p.ratings_count} ratings</span>
                                            </>
                                        ) : (
                                            <>
                                                <span className="lb-points">{p.completed_count} visits</span>
                                                <span className="muted">· {p.ratings_count} ratings</span>
                                            </>
                                        )}
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="leaderboard-empty">
                                No data yet. Once donors rate completed home visits, the leaderboard will appear here.
                            </div>
                        )}
                    </div>

                    {/* Ranked list */}
                    <div className="leaderboard-list">
                        {rest.length > 0 ? (
                            rest.map((row) => (
                                <div key={row.phlebotomist_id} className="leaderboard-row">
                                    <div className="leaderboard-row-left">
                                        <div className="leaderboard-rank">#{row.rank}</div>
                                        <div className="leaderboard-mini-avatar">{getInitials(row.name)}</div>
                                        <div className="leaderboard-row-info">
                                            <div className="leaderboard-row-name">{row.name}</div>
                                            <div className="leaderboard-row-sub muted">{row.hospital || "N/A"}</div>
                                        </div>
                                    </div>
                                    <div className="leaderboard-row-right">
                                        {activeTab === "raters" ? (
                                            <Stars value={row.avg_rating} />
                                        ) : (
                                            <span className="lb-points">{row.completed_count} visits</span>
                                        )}
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="leaderboard-empty-list">—</div>
                        )}
                    </div>

                    {/* Bottom my-rank bar */}
                    <div className="leaderboard-bottom">
                        <div className="leaderboard-bottom-left">
                            <span className="muted">Your current rank</span>
                            <strong>{myRank ? `#${myRank}` : "—"}</strong>
                        </div>
                        <div className="leaderboard-bottom-right">
                            {activeTab === "raters" ? (
                                <>
                                    <Stars value={myScorePrimary} />
                                    <span className="muted">· {myScoreSecondary} ratings</span>
                                </>
                            ) : (
                                <>
                                    <span className="lb-points">{myScorePrimary} visits</span>
                                    <span className="muted">· {myScoreSecondary} ratings</span>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}

