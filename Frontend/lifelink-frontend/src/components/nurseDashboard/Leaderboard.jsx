import { useEffect, useMemo, useState } from "react";
import { FaTrophy, FaStar } from "react-icons/fa";
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
            {rank === 1 && <div className="lb-crown">👑</div>}
            <div className="lb-avatar-circle">{initials}</div>
            <div className={`lb-rank-badge lb-rank-${rank}`}>{rank}</div>
        </div>
    );
}

export default function Leaderboard() {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [activeTab, setActiveTab] = useState("raters"); // 'raters' | 'workers'
    const [scope, setScope] = useState("hospital"); // 'hospital' | 'all'
    const [topRaters, setTopRaters] = useState([]);
    const [topWorkers, setTopWorkers] = useState([]);
    const [myStats, setMyStats] = useState(null);
    const [scopeHospitalName, setScopeHospitalName] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                setError("");
                const res = await api.get("/api/nurse/leaderboard", { params: { scope } });
                setTopRaters(res.data?.top_raters || []);
                setTopWorkers(res.data?.top_workers || []);
                setMyStats(res.data?.my_stats || null);
                setScopeHospitalName(res.data?.scope_hospital || null);
            } catch (err) {
                console.error("Error fetching leaderboard:", err);
                setError(err.response?.data?.message || err.message || "Failed to load leaderboard");
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [scope]);

    const data = activeTab === "workers" ? topWorkers : topRaters;
    const top3 = useMemo(() => data.slice(0, 3), [data]);
    const listRows = useMemo(() => (data.length > 3 ? data.slice(3) : data), [data]);

    const myRank = activeTab === "workers" ? myStats?.top_workers?.rank : myStats?.top_raters?.rank;
    const myScorePrimary = activeTab === "workers"
        ? (myStats?.top_workers?.completed_count ?? 0)
        : Number(myStats?.top_raters?.avg_rating ?? 0);
    const myScoreSecondary = activeTab === "workers"
        ? (myStats?.top_workers?.ratings_count ?? 0)
        : (myStats?.top_raters?.ratings_count ?? 0);

    const maxPrimary = useMemo(() => {
        if (!Array.isArray(data) || data.length === 0) return activeTab === "raters" ? 5 : 1;
        if (activeTab === "raters") return 5;
        const max = Math.max(...data.map((d) => Number(d.completed_count || 0)));
        return Math.max(1, max);
    }, [data, activeTab]);

    const getPrimaryValue = (row) => {
        return activeTab === "raters" ? Number(row.avg_rating || 0) : Number(row.completed_count || 0);
    };

    const getPrimaryLabel = (row) => {
        return activeTab === "raters" ? `${Number(row.avg_rating || 0).toFixed(2)} rating` : `${Number(row.completed_count || 0)} visits`;
    };

    const getProgressPct = (row) => {
        const v = getPrimaryValue(row);
        if (activeTab === "raters") return Math.max(0, Math.min(100, (v / 5) * 100));
        return Math.max(0, Math.min(100, (v / maxPrimary) * 100));
    };

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
        <section className="nurse-section">
            <div className="leaderboard-shell">
                <div className="leaderboard-card leaderboard-card-modern">
                    <div className="leaderboard-header leaderboard-header-modern">
                        <div className="leaderboard-title">
                            <FaTrophy className="leaderboard-title-icon" />
                            <h2>Leaderboard</h2>
                        </div>
                        <p className="leaderboard-subtitle">
                            {activeTab === "raters"
                                ? "Top rated phlebotomists based on donor ratings for completed home appointments"
                                : "Top performers based on completed home appointments"}
                        </p>
                        <div style={{ marginTop: 10, display: "flex", justifyContent: "center", gap: 10, flexWrap: "wrap" }}>
                            <div className="filters" style={{ maxWidth: 320 }}>
                                <select value={scope} onChange={(e) => setScope(e.target.value)} aria-label="Leaderboard scope">
                                    <option value="hospital">
                                        My hospital{scopeHospitalName ? ` (${scopeHospitalName})` : ""}
                                    </option>
                                    <option value="all">All hospitals</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    <div className="leaderboard-tabs leaderboard-tabs-modern">
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

                    <div className="leaderboard-grid">
                        {/* Podium */}
                        <div className="leaderboard-podium leaderboard-podium-modern">
                            {top3.length > 0 ? (
                                top3.map((p) => (
                                    <div key={p.phlebotomist_id} className={`leaderboard-podium-item rank-${p.rank} lb-animate-in`}>
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

                        {/* My stats */}
                        <div className="leaderboard-me lb-animate-in">
                            <div className="leaderboard-me-title">Your performance</div>
                            <div className="leaderboard-me-row">
                                <div className="leaderboard-me-label muted">Current rank</div>
                                <div className="leaderboard-me-value">{myRank ? `#${myRank}` : "—"}</div>
                            </div>
                            <div className="leaderboard-me-row">
                                <div className="leaderboard-me-label muted">{activeTab === "raters" ? "Avg rating" : "Completed visits"}</div>
                                <div className="leaderboard-me-value">
                                    {activeTab === "raters" ? (
                                        <span style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}>
                                            <Stars value={myScorePrimary} />
                                        </span>
                                    ) : (
                                        <span className="lb-points">{myScorePrimary}</span>
                                    )}
                                </div>
                            </div>
                            <div className="leaderboard-me-row">
                                <div className="leaderboard-me-label muted">Total ratings</div>
                                <div className="leaderboard-me-value">{Number(myScoreSecondary || 0)}</div>
                            </div>

                            <div className="leaderboard-me-hint muted">
                                Tip: complete visits and encourage donors to leave ratings to climb the leaderboard.
                            </div>
                        </div>
                    </div>

                    {/* Ranked list */}
                    <div className="leaderboard-list leaderboard-list-modern">
                        {listRows.length > 0 ? (
                            listRows.map((row) => (
                                <div key={row.phlebotomist_id} className="leaderboard-row leaderboard-row-modern lb-animate-in">
                                    <div className="leaderboard-row-left">
                                        <div className="leaderboard-rank">#{row.rank}</div>
                                        <div className="leaderboard-mini-avatar">{getInitials(row.name)}</div>
                                        <div className="leaderboard-row-info">
                                            <div className="leaderboard-row-name">{row.name}</div>
                                            <div className="leaderboard-row-sub muted">{row.hospital || "N/A"}</div>
                                        </div>
                                    </div>
                                    <div className="leaderboard-row-right">
                                        <div className="lb-score-stack">
                                            <div className="lb-score-top">
                                                {activeTab === "raters" ? <Stars value={row.avg_rating} /> : <span className="lb-points">{row.completed_count} visits</span>}
                                            </div>
                                            <div className="lb-progress">
                                                <div className="lb-progress-bar" style={{ width: `${getProgressPct(row)}%` }} />
                                            </div>
                                            <div className="lb-score-sub muted">{getPrimaryLabel(row)}</div>
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="leaderboard-empty-list">
                                {Array.isArray(data) && data.length > 0
                                    ? `Only ${data.length} result(s) available right now.`
                                    : "—"}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </section>
    );
}

