import { useEffect, useMemo, useRef, useState } from "react";
import api from "../../api/axios";

const clamp = (n, min, max) => Math.max(min, Math.min(max, n));

const formatNumber = (n) => {
  const v = Number(n || 0);
  return v.toLocaleString();
};

function useInViewOnce() {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    if (!ref.current) return;
    const el = ref.current;

    const obs = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setInView(true);
          obs.disconnect();
        }
      },
      { threshold: 0.25 }
    );

    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return { ref, inView };
}

function animateCount(from, to, durationMs, onUpdate) {
  const start = performance.now();
  const delta = to - from;

  const tick = (now) => {
    const t = clamp((now - start) / durationMs, 0, 1);
    // easeOutCubic
    const eased = 1 - Math.pow(1 - t, 3);
    onUpdate(from + delta * eased);
    if (t < 1) requestAnimationFrame(tick);
  };

  requestAnimationFrame(tick);
}

export default function GlobalDonationStats() {
  const { ref, inView } = useInViewOnce();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [stats, setStats] = useState({
    scope: "worldwide",
    year: null,
    metrics: {
      blood_donations_per_year: 0,
      organ_transplants_per_year: 0,
      donated_money_share_pct: 0,
    },
    organ_transplants_breakdown: {
      kidney: 0,
      liver: 0,
      heart: 0,
      lung: 0,
      pancreas: 0,
      other: 0,
    },
    sources: [],
    note: "",
  });

  const [display, setDisplay] = useState({
    blood_donations_per_year: 0,
    organ_transplants_per_year: 0,
    donated_money_share_pct: 0,
  });

  // Animated pie sweep for organ breakdown (0..1)
  const [pieT, setPieT] = useState(0);

  useEffect(() => {
    let mounted = true;

    const fetchStats = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await api.get("/api/public/donation-stats");
        if (!mounted) return;
        setStats(res.data);
      } catch (e) {
        if (!mounted) return;
        const hint = e.response?.data?.hint ? ` (${e.response.data.hint})` : "";
        setError((e.response?.data?.message || "Failed to load donation statistics") + hint);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchStats();
    return () => {
      mounted = false;
    };
  }, []);

  const m = stats.metrics || {};
  const ob = stats.organ_transplants_breakdown || {};
  const targets = useMemo(
    () => ({
      blood: Number(m.blood_donations_per_year || 0),
      organ: Number(m.organ_transplants_per_year || 0),
      moneyPct: Number(m.donated_money_share_pct || 0),
    }),
    [m]
  );

  const organBreakdown = useMemo(() => {
    const kidney = Number(ob.kidney || 0);
    const liver = Number(ob.liver || 0);
    const heart = Number(ob.heart || 0);
    const lung = Number(ob.lung || 0);
    const pancreas = Number(ob.pancreas || 0);
    const other = Number(ob.other || 0);
    const total = Math.max(kidney + liver + heart + lung + pancreas + other, 1);
    return {
      kidney,
      liver,
      heart,
      lung,
      pancreas,
      other,
      total,
    };
  }, [ob]);

  useEffect(() => {
    if (!inView || loading || error) return;

    animateCount(0, targets.blood, 950, (v) => setDisplay((p) => ({ ...p, blood_donations_per_year: Math.round(v) })));
    animateCount(0, targets.organ, 900, (v) => setDisplay((p) => ({ ...p, organ_transplants_per_year: Math.round(v) })));
    animateCount(0, targets.moneyPct, 850, (v) => setDisplay((p) => ({ ...p, donated_money_share_pct: Number(v.toFixed(1)) })));

    const steps = 26;
    for (let i = 1; i <= steps; i++) {
      const delay = i * 16;
      setTimeout(() => {
        const t = i / steps;
        const eased = 1 - Math.pow(1 - t, 3);
        setPieT(eased);
      }, delay);
    }
  }, [inView, loading, error, targets]);

  const pieBackground = useMemo(() => {
    const t = clamp(pieT, 0, 1);
    const total = organBreakdown.total || 1;

    const parts = [
      { key: "kidney", label: "Kidney", value: organBreakdown.kidney, color: "#F12C31" },
      { key: "liver", label: "Liver", value: organBreakdown.liver, color: "#b91c1c" },
      { key: "heart", label: "Heart", value: organBreakdown.heart, color: "#111827" },
      { key: "lung", label: "Lung", value: organBreakdown.lung, color: "#374151" },
      { key: "pancreas", label: "Pancreas", value: organBreakdown.pancreas, color: "#9ca3af" },
      { key: "other", label: "Other", value: organBreakdown.other, color: "#e5e7eb" },
    ];

    let start = 0;
    const stops = parts.map((p) => {
      const pct = ((p.value / total) * 100) * t;
      const seg = `${p.color} ${start}% ${start + pct}%`;
      start += pct;
      return seg;
    });

    // Fill remainder as transparent so it looks like it "draws in"
    if (start < 100) stops.push(`rgba(0,0,0,0) ${start}% 100%`);
    return `conic-gradient(${stops.join(", ")})`;
  }, [pieT, organBreakdown]);

  const organLegend = useMemo(() => {
    const total = organBreakdown.total || 1;
    const pct = (v) => ((v / total) * 100).toFixed(1);
    return [
      { label: "Kidney", value: organBreakdown.kidney, pct: pct(organBreakdown.kidney), swatch: "swatch-red" },
      { label: "Liver", value: organBreakdown.liver, pct: pct(organBreakdown.liver), swatch: "swatch-darkred" },
      { label: "Heart", value: organBreakdown.heart, pct: pct(organBreakdown.heart), swatch: "swatch-black" },
      { label: "Lung", value: organBreakdown.lung, pct: pct(organBreakdown.lung), swatch: "swatch-slate" },
      { label: "Pancreas", value: organBreakdown.pancreas, pct: pct(organBreakdown.pancreas), swatch: "swatch-gray" },
      { label: "Other", value: organBreakdown.other, pct: pct(organBreakdown.other), swatch: "swatch-light" },
    ];
  }, [organBreakdown]);

  return (
    <section ref={ref} className="home-stats-section">
      <div className="home-stats-shell">
        <div className="home-stats-header">
          <h2 className="home-stats-title">Worldwide Donation Snapshot</h2>
          <p className="home-stats-subtitle">
            Worldwide estimates . since {stats.year ? `Year: ${stats.year}.` : ""}
          </p>
        </div>

        {loading ? (
          <div className="home-stats-loading">Loading worldwide statistics...</div>
        ) : error ? (
          <div className="home-stats-error">{error}</div>
        ) : (
          <div className="home-stats-grid">
            <div className="home-stats-card home-stats-card-dark">
              <div className="home-stats-card-top">
                <div>
                  <div className="home-stats-kicker">Blood Donations / Year (Worldwide)</div>
                  <div className="home-stats-number">{formatNumber(display.blood_donations_per_year)}</div>
                </div>
                <div className="home-stats-badge">Estimated</div>
              </div>

              <div className="home-stats-mini">
                <div className="home-stats-mini-item">
                  <div className="dot dot-black" />
                  <div>
                    <div className="mini-label">Organ transplants / year</div>
                    <div className="mini-value">{formatNumber(display.organ_transplants_per_year)}</div>
                  </div>
                </div>
                <div className="home-stats-mini-item">
                  <div className="dot dot-gray" />
                  <div>
                    <div className="mini-label">Donated money (share)</div>
                    <div className="mini-value">{display.donated_money_share_pct ? `${display.donated_money_share_pct}%` : "N/A"}</div>
                  </div>
                </div>
                <div className="home-stats-mini-item">
                  <div className="dot dot-red" />
                  <div>
                    <div className="mini-label">Scope</div>
                    <div className="mini-value">Worldwide</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="home-stats-card">
              <div className="home-stats-card-top">
                <div>
                  <div className="home-stats-kicker">Organ Transplants Breakdown</div>
                  <div className="home-stats-help">Worldwide distribution by organ type</div>
                </div>
              </div>

              <div className="home-stats-pie-row">
                <div className="home-stats-pie" style={{ background: pieBackground }} aria-label="Worldwide organ transplants pie chart" />
                <div className="home-stats-legend">
                  {organLegend.map((it) => (
                    <div className="legend-item" key={it.label}>
                      <span className={`legend-swatch ${it.swatch}`} />
                      <span className="legend-label">{it.label}</span>
                      <span className="legend-value">{it.pct}%</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="home-stats-footnote">{stats.note || "Worldwide estimates."}</div>
            </div>

            <div className="home-stats-card home-stats-card-outline">
              <div className="home-stats-card-top">
                <div>
                  <div className="home-stats-kicker">Sources</div>
                  <div className="home-stats-help">Tap to open references</div>
                </div>
              </div>

              <div className="home-stats-sources">
                {(stats.sources || []).map((s, idx) => (
                  <a key={idx} className="home-stats-source" href={s.url} target="_blank" rel="noreferrer">
                    {s.label}
                  </a>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

