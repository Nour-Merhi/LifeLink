import { useMemo, useState } from "react";
import {
  ResponsiveContainer,
  ComposedChart,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from "recharts";
import { FaUsers, FaUser, FaUserNurse, FaHospital, FaCalendarCheck, FaHeartbeat, FaHandHoldingUsd } from "react-icons/fa";
import "../../styles/Dashboard.css";

// Admin Analytics Dashboard (Recharts)
// - Uses mock data shaped like API responses (replace with real API calls later)
// - Fully responsive via ResponsiveContainer
export default function Analytics() {
  const RANGE_OPTIONS = [
    { key: "7d", label: "Last 7 days" },
    { key: "30d", label: "Last 30 days" },
    { key: "3m", label: "Last 3 months" },
    { key: "1y", label: "Last year" },
  ];

  const [rangeKey, setRangeKey] = useState("30d");

  // ---- deterministic dummy-data helpers (so UI doesn't "jump" randomly) ----
  const hashSeed = (str) => {
    let h = 2166136261;
    for (let i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  };

  const mulberry32 = (seed) => {
    return function rand() {
      let t = (seed += 0x6D2B79F5);
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  };

  const rngFor = useMemo(() => {
    return (tag) => mulberry32(hashSeed(`admin-analytics:${rangeKey}:${tag}`));
  }, [rangeKey]);

  const fmtDayLabel = (d) => d.toLocaleDateString(undefined, { month: "short", day: "2-digit" });
  const fmtMonthLabel = (d) => d.toLocaleDateString(undefined, { month: "short" });

  const timeBuckets = useMemo(() => {
    const now = new Date();
    const buckets = [];

    const pushDays = (count) => {
      for (let i = count - 1; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(now.getDate() - i);
        buckets.push({ label: fmtDayLabel(d), date: d });
      }
    };

    const pushMonths = (count) => {
      for (let i = count - 1; i >= 0; i--) {
        const d = new Date(now);
        d.setMonth(now.getMonth() - i);
        buckets.push({ label: fmtMonthLabel(d), date: d });
      }
    };

    if (rangeKey === "7d") pushDays(7);
    else if (rangeKey === "30d") pushDays(30);
    else if (rangeKey === "3m") pushMonths(3);
    else pushMonths(12); // 1y

    return buckets;
  }, [rangeKey]);

  /**
   * MOCK API RESPONSES (shape them like backend responses)
   * Replace these with real API calls and setState from responses.
   */
  const [roleStats] = useState({
    totals: {
      donors: 1240,
      phlebotomists: 86,
      hospital_managers: 34,
    },
  });

  const appointmentStats = useMemo(() => {
    const rng = rngFor("appointments");

    const homeBase = rangeKey === "7d" ? 14 : rangeKey === "30d" ? 12 : rangeKey === "3m" ? 260 : 900;
    const hospitalBase = rangeKey === "7d" ? 22 : rangeKey === "30d" ? 20 : rangeKey === "3m" ? 420 : 1450;

    const trend = timeBuckets.map((b, idx) => {
      const noiseHome = (rng() - 0.5) * 0.35;
      const noiseHosp = (rng() - 0.5) * 0.35;
      const season = Math.sin((idx / Math.max(1, timeBuckets.length - 1)) * Math.PI) * 0.12;

      const home = Math.max(0, Math.round(homeBase * (1 + noiseHome + season)));
      const hospital = Math.max(0, Math.round(hospitalBase * (1 + noiseHosp + season)));

      return { date: b.label, home, hospital };
    });

    const totals = trend.reduce(
      (acc, row) => ({
        home_visits: acc.home_visits + row.home,
        hospital_visits: acc.hospital_visits + row.hospital,
      }),
      { home_visits: 0, hospital_visits: 0 }
    );

    return { totals, trend };
  }, [rangeKey, rngFor, timeBuckets]);

  // Dummy outcomes so we can compute "success rate" per appointment type
  const appointmentOutcomeStats = useMemo(() => {
    const rng = rngFor("appointment-outcomes");
    const homeTotal = appointmentStats.totals.home_visits;
    const hospitalTotal = appointmentStats.totals.hospital_visits;

    const homeRatio = 0.9 + (rng() - 0.5) * 0.04; // ~88% - 92%
    const hospRatio = 0.92 + (rng() - 0.5) * 0.04; // ~90% - 94%

    const homeSuccess = Math.max(0, Math.min(homeTotal, Math.round(homeTotal * homeRatio)));
    const hospitalSuccess = Math.max(0, Math.min(hospitalTotal, Math.round(hospitalTotal * hospRatio)));

    return {
      home: { total: homeTotal, success: homeSuccess },
      hospital: { total: hospitalTotal, success: hospitalSuccess },
    };
  }, [appointmentStats, rngFor]);

  const bloodDonationStats = useMemo(() => {
    const rng = rngFor("blood-donations");
    const blood_types = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

    const weights = {
      "O+": 1.6,
      "A+": 1.2,
      "B+": 1.0,
      "O-": 0.55,
      "A-": 0.45,
      "B-": 0.35,
      "AB+": 0.32,
      "AB-": 0.18,
    };
    const sumW = blood_types.reduce((s, bt) => s + (weights[bt] || 1), 0);

    const monthly = timeBuckets.map((b, idx) => {
      const row = { month: b.label };
      const baseTotal = rangeKey === "7d" ? 55 : rangeKey === "30d" ? 48 : rangeKey === "3m" ? 420 : 1500;
      const total = Math.max(
        0,
        Math.round(
          baseTotal * (1 + (rng() - 0.5) * 0.25 + Math.sin((idx / Math.max(1, timeBuckets.length - 1)) * Math.PI) * 0.08)
        )
      );

      let remaining = total;
      blood_types.forEach((bt, i) => {
        if (i === blood_types.length - 1) {
          row[bt] = Math.max(0, remaining);
          return;
        }
        const ideal = (total * (weights[bt] || 1)) / sumW;
        const noisy = Math.max(0, Math.round(ideal * (0.9 + rng() * 0.25)));
        const v = Math.min(remaining, noisy);
        row[bt] = v;
        remaining -= v;
      });

      return row;
    });

    return { blood_types, monthly };
  }, [rangeKey, rngFor, timeBuckets]);

  const organPledgeStats = useMemo(() => {
    const rng = rngFor("organ-pledges");
    const baseLive = rangeKey === "7d" ? 8 : rangeKey === "30d" ? 6 : rangeKey === "3m" ? 55 : 190;
    const baseAfter = rangeKey === "7d" ? 20 : rangeKey === "30d" ? 18 : rangeKey === "3m" ? 150 : 540;

    const trend = timeBuckets.map((b, idx) => {
      const season = Math.cos((idx / Math.max(1, timeBuckets.length - 1)) * Math.PI) * 0.1;
      const live = Math.max(0, Math.round(baseLive * (1 + (rng() - 0.5) * 0.4 + season)));
      const after_death = Math.max(0, Math.round(baseAfter * (1 + (rng() - 0.5) * 0.35 + season)));
      return { date: b.label, live, after_death };
    });

    const totals = trend.reduce(
      (acc, r) => ({ live: acc.live + r.live, after_death: acc.after_death + r.after_death }),
      { live: 0, after_death: 0 }
    );

    return { totals, trend };
  }, [rangeKey, rngFor, timeBuckets]);

  const financialStats = useMemo(() => {
    const rng = rngFor("financial");

    const trend_by_month = timeBuckets.map((b, idx) => {
      const scale = rangeKey === "7d" ? 1 : rangeKey === "30d" ? 1.15 : rangeKey === "3m" ? 5 : 16;
      const approved = Math.max(0, Math.round((3 + rng() * 5 + idx * 0.1) * scale));
      const pending = Math.max(0, Math.round((2 + rng() * 4) * scale));
      const rejected = Math.max(0, Math.round((1 + rng() * 3) * scale));
      return { month: b.label, approved, pending, rejected };
    });

    const statuses = trend_by_month.reduce(
      (acc, r) => ({
        approved: acc.approved + r.approved,
        pending: acc.pending + r.pending,
        rejected: acc.rejected + r.rejected,
      }),
      { approved: 0, pending: 0, rejected: 0 }
    );

    const requests = statuses.approved + statuses.pending + statuses.rejected;
    const amount_funded = Math.round(statuses.approved * (900 + rng() * 600));

    return {
      totals: { requests, amount_funded },
      statuses,
      trend_by_month,
    };
  }, [rangeKey, rngFor, timeBuckets]);

  // Project palette: red / black / blue / green / yellow (with neutrals)
  const COLORS = {
    black: "#0b0b0f",
    darkRed : "#BE2327",
    red: "#F12C31",
    lightRed: "#fb7185",
    blue: "#2563eb",
    lightBlue: "#60a5fa",
    green: "#16a34a",
    lightGreen: "#34d399",
    yellow: "#f59e0b",
    lightYellow: "#fbbf24",
    gray: "#a1a1aa",
    grid: "rgba(219, 219, 219, 0.08)",
    text: "#222222",
  };

  /**
   * Derived chart data
   */
  const donorActivityData = useMemo(() => {
    const rng = rngFor("donor-activity");
    const totalDonors = Number(roleStats.totals.donors) || 0;

    const base =
      rangeKey === "7d" ? 0.12 : rangeKey === "30d" ? 0.22 : rangeKey === "3m" ? 0.42 : 0.72;
    const noise = (rng() - 0.5) * 0.08; // +/- 4%
    const activeRatio = Math.max(0, Math.min(1, base + noise));
    const active = Math.max(0, Math.min(totalDonors, Math.round(totalDonors * activeRatio)));
    const inactive = Math.max(0, totalDonors - active);

    return {
      total: totalDonors,
      active,
      inactive,
      pie: [
        { name: "Active donors", value: active, fill: COLORS.red },
        { name: "Inactive donors", value: inactive, fill: COLORS.darkRed },
      ],
    };
  }, [COLORS.red, COLORS.darkRed, rangeKey, rngFor, roleStats.totals.donors]);

  const appointmentPieData = useMemo(
    () => [
      { name: "Home Visits", value: appointmentStats.totals.home_visits },
      { name: "Hospital Visits", value: appointmentStats.totals.hospital_visits },
    ],
    [appointmentStats]
  );

  const appointmentStatusRateData = useMemo(() => {
    const rng = rngFor("appointment-status-breakdown");

    const build = (type, total) => {
      const t = Number(total) || 0;
      // keep it realistic: completed majority, then pending, then cancelled
      const completedRatio = 0.78 + (rng() - 0.5) * 0.08; // ~74% - 82%
      const cancelledRatio = 0.06 + (rng() - 0.5) * 0.04; // ~4% - 8%
      const pendingRatio = Math.max(0, 1 - completedRatio - cancelledRatio);

      const completed = Math.max(0, Math.min(t, Math.round(t * completedRatio)));
      const cancelled = Math.max(0, Math.min(t - completed, Math.round(t * cancelledRatio)));
      const pending = Math.max(0, t - completed - cancelled);

      const pct = (x) => (t > 0 ? Number(((x / t) * 100).toFixed(1)) : 0);

      return {
        type,
        completed_pct: pct(completed),
        pending_pct: pct(pending),
        cancelled_pct: pct(cancelled),
        completed,
        pending,
        cancelled,
        total: t,
      };
    };

    return [
      build("Home", appointmentStats.totals.home_visits),
      build("Hospital", appointmentStats.totals.hospital_visits),
    ];
  }, [appointmentStats, rngFor]);

  const phlebotomistStats = useMemo(() => {
    const rng = rngFor("phlebotomists-performance");
    const totalPhlebotomists = Number(roleStats.totals.phlebotomists) || 0;

    // Show top performers (dummy list)
    const names = [
      "A. Nasser",
      "M. Samir",
      "L. Yara",
      "H. Karim",
      "R. Nour",
      "S. Dalia",
    ];

    const count = Math.min(names.length, Math.max(3, Math.min(6, totalPhlebotomists || 6)));

    const baseCompleted =
      rangeKey === "7d" ? 10 : rangeKey === "30d" ? 28 : rangeKey === "3m" ? 85 : 320;

    const rows = Array.from({ length: count }).map((_, i) => {
      const completed = Math.max(0, Math.round(baseCompleted * (0.7 + rng() * 0.9)));
      const failed = Math.max(0, Math.round(completed * (0.04 + rng() * 0.07))); // 4% - 11% of completed
      const total = completed + failed;
      const successRate = total > 0 ? (completed / total) * 100 : 0;

      return {
        name: names[i],
        completed,
        failed,
        total,
        success_rate_pct: Number(successRate.toFixed(1)),
      };
    });

    const totalCompleted = rows.reduce((s, r) => s + (r.completed || 0), 0);
    const avgSuccessRate =
      rows.length > 0 ? Number((rows.reduce((s, r) => s + (r.success_rate_pct || 0), 0) / rows.length).toFixed(1)) : 0;

    return { totalPhlebotomists, totalCompleted, avgSuccessRate, rows };
  }, [rangeKey, rngFor, roleStats.totals.phlebotomists]);

  const fundsSplit = useMemo(() => {
    const rng = rngFor("funds-split");
    const total = Number(financialStats.totals.amount_funded) || 0;

    // Portion of donations going to specific patient cases vs general pool
    const baseCaseRatio =
      rangeKey === "7d" ? 0.55 : rangeKey === "30d" ? 0.6 : rangeKey === "3m" ? 0.62 : 0.65;
    const caseRatio = Math.max(0, Math.min(1, baseCaseRatio + (rng() - 0.5) * 0.08));

    const toCases = Math.max(0, Math.round(total * caseRatio));
    const toGeneral = Math.max(0, total - toCases);

    const pie = [
      { name: "Specific patient cases", value: toCases, fill: COLORS.green },
      { name: "General donations", value: toGeneral, fill: COLORS.blue },
    ];

    const bars = [
      { type: "Patient cases", amount: toCases, pct: total > 0 ? Number(((toCases / total) * 100).toFixed(1)) : 0 },
      { type: "General", amount: toGeneral, pct: total > 0 ? Number(((toGeneral / total) * 100).toFixed(1)) : 0 },
    ];

    return { total, toCases, toGeneral, pie, bars };
  }, [COLORS.blue, COLORS.darkRed, financialStats.totals.amount_funded, rangeKey, rngFor]);

  const organChoiceData = useMemo(() => {
    const rng = rngFor("organ-choice");

    const organs = [
      { name: "Kidney", fill: COLORS.blue},
      { name: "Liver", fill: COLORS.lightBlue },
      { name: "Heart", fill: COLORS.green },
      { name: "Lung", fill: COLORS.lightGreen },
      { name: "Pancreas", fill: COLORS.yellow },
      { name: "Cornea", fill: COLORS.lightYellow },
    ];

    const totalPledges = (organPledgeStats.totals.live || 0) + (organPledgeStats.totals.after_death || 0);
    if (totalPledges <= 0) {
      return { total: 0, pie: organs.map((o) => ({ ...o, value: 0 })) };
    }

    // Weighted distribution (kidney/liver tend to be higher in demos)
    const weights = {
      Kidney: 1.4,
      Liver: 1.1,
      Heart: 0.75,
      Lung: 0.8,
      Pancreas: 0.55,
      Cornea: 0.9,
    };
    const sumW = organs.reduce((s, o) => s + (weights[o.name] || 1), 0);

    let remaining = totalPledges;
    const pie = organs.map((o, idx) => {
      if (idx === organs.length - 1) {
        return { ...o, value: Math.max(0, remaining) };
      }
      const ideal = (totalPledges * (weights[o.name] || 1)) / sumW;
      const noisy = Math.max(0, Math.round(ideal * (0.9 + rng() * 0.25)));
      const v = Math.min(remaining, noisy);
      remaining -= v;
      return { ...o, value: v };
    });

    return { total: totalPledges, pie };
  }, [
    COLORS.blue,
    COLORS.darkRed,
    COLORS.lightBlue,
    COLORS.lightYellow,
    COLORS.red,
    COLORS.yellow,
    organPledgeStats.totals.after_death,
    organPledgeStats.totals.live,
    rngFor,
  ]);

  const kpis = useMemo(() => {
    const totalUsers =
      roleStats.totals.donors + roleStats.totals.phlebotomists + roleStats.totals.hospital_managers;
    const totalAppointments = appointmentStats.totals.home_visits + appointmentStats.totals.hospital_visits;
    const totalPledges = organPledgeStats.totals.live + organPledgeStats.totals.after_death;

    return [
      // Metric-card design system (same structure used in Phlebotomist.jsx / HospitalAppointments.jsx)
      {
        title: "Total Users",
        value: totalUsers.toLocaleString(),
        change: "",
        icon: <FaUsers className="text-3xl" />,
        bgColor: "#FFE5E5",
        iconColor: "#F12C31",
      },
      {
        title: "Donors",
        value: roleStats.totals.donors.toLocaleString(),
        change: "Registered donors",
        icon: <FaUser className="text-3xl" />,
        bgColor: "#FFE5E5",
        iconColor: "#F12C31",
      },
      {
        title: "Phlebotomists",
        value: roleStats.totals.phlebotomists.toLocaleString(),
        change: "Certified staff",
        icon: <FaUserNurse className="text-3xl" />,
        bgColor: "#EBEAFF",
        iconColor: "#285BFF",
      },
      {
        title: "Hospital Managers",
        value: roleStats.totals.hospital_managers.toLocaleString(),
        change: "Partner hospitals",
        icon: <FaHospital className="text-3xl" />,
        bgColor: "#FFF7D6",
        iconColor: "#B45309",
      },
      {
        title: "Total Appointments",
        value: totalAppointments.toLocaleString(),
        change: "Home + Hospital visits",
        icon: <FaCalendarCheck className="text-3xl" />,
        bgColor: "#EAFFE5",
        iconColor: "#16a34a",
      },
      {
        title: "Organ Pledges",
        value: totalPledges.toLocaleString(),
        change: "Live + After-death",
        icon: <FaHeartbeat className="text-3xl" />,
        bgColor: "#EAFFE5",
        iconColor: "#16a34a",
      },
      {
        title: "Financial Requests",
        value: financialStats.totals.requests.toLocaleString(),
        change: "Support cases",
        icon: <FaHandHoldingUsd className="text-3xl" />,
        bgColor: "#FFF7D6",
        iconColor: "#B45309",
      },
      {
        title: "Total Funded",
        value: `$${financialStats.totals.amount_funded.toLocaleString()}`,
        change: "Approved funding total",
        icon: <FaHandHoldingUsd className="text-3xl" />,
        bgColor: "#EAFFE5",
        iconColor: "#16a34a",
      },
    ];
  }, [roleStats, appointmentStats, organPledgeStats, financialStats]);

  

  const tooltipStyle = {
    background:"white",
    border: `2px solid rgba(206, 206, 206, 0.35)`,
    borderRadius: 10,
    color: "#222222",
  };

  // Home vs Hospital (keep it simple: blue vs red)
  const pieColors = [COLORS.lightBlue, COLORS.red];

  // Blood types: keep within brand palette using shades of red/blue/green/yellow
  const bloodColors = {
    "A+": COLORS.red,
    "A-": COLORS.lightRed, // red/rose tint
    "B+": COLORS.blue,
    "B-": COLORS.lightBlue, // blue tint
    "AB+": COLORS.yellow,
    "AB-": COLORS.lightYellow, // yellow tint
    "O+": COLORS.green,
    "O-": COLORS.lightGreen, // green tint
  };

  const cardClass = "rounded-[5px] shadow bg-white backdrop-blur p-4 md:p-5";
  const chartWrapClass = "h-[280px] md:h-[320px]";

  return (
    <div className="min-h-[calc(100vh-80px)]">
      {/* Dark surface to match project palette (admin layout background is light) */}
      <div>
      {/* Header */}
      <div className="mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <h2 className="text-2xl md:text-3xl font-semibold tracking-tight">Admin Analytics</h2>
            <p className="mt-1 !text-[16px] md:!text-base">
              Platform insights across users, appointments, blood donations, organ pledges, and financial support.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm text-gray-600">Filter:</span>
            <select
              value={rangeKey}
              onChange={(e) => setRangeKey(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white shadow-sm"
            >
              {RANGE_OPTIONS.map((o) => (
                <option key={o.key} value={o.key}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="metrics-grid-4">
        {kpis.map((metric, index) => (
          <div key={`${metric.title}-${index}`} className={`metric-card ${index === 0 ? "linear-red" : ""}`}>
            <div className="metric-content">
              <div className="metric-info">
                <p className={`metric-title ${index === 0 ? "!text-white" : ""}`}>{metric.title}</p>
                <h3 className={`metric-value ${index === 0 ? "!text-white" : ""}`}>{metric.value}</h3>
                <span className={`metric-change ${index === 0 ? "!text-white" : ""}`}>{metric.change}</span>
              </div>
              <div className="metric-icon" style={{ backgroundColor: metric.bgColor, color: metric.iconColor }}>
                {metric.icon}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
     
        {/* 2) Appointment Statistics (Trend Line) */}
        <section className={`lg:col-span-7 ${cardClass}`}>
          <div className="mb-3">
            <div className="text-sm font-semibold">Appointment Trends Over Time</div>
            <div className="text-xs">Monthly trends for home and hospital appointments</div>
          </div>
          <div className="h-[300px] md:h-[360px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={appointmentStats.trend} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                <XAxis dataKey="date" tick={{ fill: COLORS.text, fontSize: 12 }} />
                <YAxis tick={{ fill: COLORS.text, fontSize: 12 }} />
                <Tooltip contentStyle={tooltipStyle} />
                <Legend />
                <Line type="monotone" dataKey="home" name="Home Visits" stroke={COLORS.blue} strokeWidth={2.5} dot={false} />
                <Line type="monotone" dataKey="hospital" name="Hospital Visits" stroke={COLORS.red} strokeWidth={2.5} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </section>

        {/* 3) Appointment Status Rate (Home vs Hospital) */}
        <section className={`lg:col-span-5 ${cardClass}`}>
          <div className="mb-3">
            <div className="text-sm font-semibold">Appointments Status Rate</div>
            <div className="text-xs">Home vs Hospital: completed / pending / cancelled (%)</div>
          </div>
          <div className="h-[320px] md:h-[380px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={appointmentStatusRateData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                <XAxis dataKey="type" tick={{ fill: COLORS.text, fontSize: 12 }} />
                <YAxis
                  domain={[0, 100]}
                  tick={{ fill: COLORS.text, fontSize: 12 }}
                  tickFormatter={(v) => `${v}%`}
                />
                <Tooltip
                  contentStyle={tooltipStyle}
                  formatter={(value, name, props) => {
                    const row = props?.payload;
                    const t = row?.total ?? 0;
                    if (name === "Completed") return [`${value}% (${row?.completed ?? 0}/${t})`, "Completed"];
                    if (name === "Pending") return [`${value}% (${row?.pending ?? 0}/${t})`, "Pending"];
                    if (name === "Cancelled") return [`${value}% (${row?.cancelled ?? 0}/${t})`, "Cancelled"];
                    return [`${value}%`, name];
                  }}
                />
                <Legend />
                <Bar dataKey="completed_pct" name="Completed" fill={COLORS.red} radius={[10, 10, 0, 0]} />
                <Bar dataKey="pending_pct" name="Pending" fill={COLORS.blue} radius={[10, 10, 0, 0]} />
                <Bar dataKey="cancelled_pct" name="Cancelled" fill={COLORS.lightYellow} radius={[10, 10, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        {/* 3) Phlebotomists Performance */}
        <section className={`lg:col-span-6 ${cardClass}`}>
          <div className="mb-3">
            <div className="text-sm font-semibold">Phlebotomists Performance</div>
            <div className="text-xs">Success rate (%) and completed appointments</div>
          </div>

          <div className="flex flex-wrap gap-3 text-sm mb-3">
            <span className="text-gray-700">
              <b>{phlebotomistStats.totalPhlebotomists.toLocaleString()}</b> Phlebotomists
            </span>
            <span className="text-gray-700">
              <b>{phlebotomistStats.totalCompleted.toLocaleString()}</b> Completed
            </span>
            <span className="text-gray-700">
              <b>{phlebotomistStats.avgSuccessRate}%</b> Avg success rate
            </span>
          </div>

          <div className="h-[320px] md:h-[380px]">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={phlebotomistStats.rows} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                <XAxis dataKey="name" tick={{ fill: COLORS.text, fontSize: 12 }} />
                <YAxis yAxisId="left" tick={{ fill: COLORS.text, fontSize: 12 }} />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  domain={[0, 100]}
                  tick={{ fill: COLORS.text, fontSize: 12 }}
                  tickFormatter={(v) => `${v}%`}
                />
                <Tooltip
                  contentStyle={tooltipStyle}
                  formatter={(value, name, props) => {
                    const row = props?.payload;
                    if (name === "Success rate") return [`${value}%`, "Success rate"];
                    if (name === "Completed") return [Number(value || 0).toLocaleString(), "Completed"];
                    return [value, name];
                  }}
                />
                <Legend />
                <Bar yAxisId="left" dataKey="completed" name="Completed" fill={COLORS.green} radius={[10, 10, 0, 0]} />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="success_rate_pct"
                  name="Success rate"
                  stroke={COLORS.blue}
                  strokeWidth={2.5}
                  dot={{ r: 3 }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </section>

        {/* 3) Blood Donation Trends (Stacked bar by month) */}
        <section className={`lg:col-span-6 ${cardClass}`}>
          <div className="mb-3">
            <div className="text-sm font-semibold">Monthly Donations per Blood Type</div>
            <div className="text-xs">Stacked bar chart</div>
          </div>
          <div className="h-[320px] md:h-[380px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={bloodDonationStats.monthly} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                <XAxis dataKey="month" tick={{ fill: COLORS.text, fontSize: 12 }} />
                <YAxis tick={{ fill: COLORS.text, fontSize: 12 }} />
                <Tooltip contentStyle={tooltipStyle} />
                <Legend />
                {bloodDonationStats.blood_types.map((bt, index) => (
                  <Bar key={bt} dataKey={bt} stackId="blood" fill={bloodColors[bt] || COLORS.gray} />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        {/* 4) Organ Donation Choices (Pie) */}
        <section className={`lg:col-span-3 ${cardClass}`}>
          <div className="mb-3">
            <div className="text-sm font-semibold">Organs Chosen for Donation</div>
            <div className="text-xs">Distribution of pledged organs (%)</div>
          </div>
          <div className={chartWrapClass}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Tooltip
                  contentStyle={tooltipStyle}
                  formatter={(value, name) => {
                    const total = organChoiceData.total || 0;
                    const v = Number(value) || 0;
                    const pct = total > 0 ? ((v / total) * 100).toFixed(1) : "0.0";
                    return [`${pct}% (${v.toLocaleString()}/${total.toLocaleString()})`, name];
                  }}
                />
                <Legend />
                <Pie
                  data={organChoiceData.pie}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={0}
                  outerRadius={95}
                  paddingAngle={0}
                >
                  {organChoiceData.pie.map((slice) => (
                    <Cell key={slice.name} fill={slice.fill} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </section>

        {/* 4) Organ Pledge Statistics (Trend Line) */}
        <section className={`lg:col-span-6 ${cardClass}`}>
          <div className="mb-3">
            <div className="text-sm font-semibold">Organ Pledge Growth Over Time</div>
            <div className="text-xs">Trend line by pledge type</div>
          </div>
          <div className={chartWrapClass}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={organPledgeStats.trend} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                <XAxis dataKey="date" tick={{ fill: COLORS.text, fontSize: 12 }} />
                <YAxis tick={{ fill: COLORS.text, fontSize: 12 }} />
                <Tooltip contentStyle={tooltipStyle} />
                <Legend />
                <Line type="monotone" dataKey="live" name="Live" stroke={COLORS.green} strokeWidth={2.5} dot={false} />
                <Line type="monotone" dataKey="after_death" name="After-death" stroke={COLORS.yellow} strokeWidth={2.5} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </section>

        {/* 5) Donations: Patient Cases vs General */}
        <section className={`lg:col-span-3 ${cardClass}`}>
          <div className="mb-3">
            <div className="text-sm font-semibold">Donations Split</div>
            <div className="text-xs">Specific patient cases vs general donations</div>
          </div>

          <div className="flex flex-wrap gap-3 text-sm">
            <span className="text-gray-700">
              <b>${fundsSplit.toCases.toLocaleString()}</b> Cases
            </span>
            <span className="text-gray-700">
              <b>${fundsSplit.toGeneral.toLocaleString()}</b> General
            </span>
          </div>

          <div className={chartWrapClass}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Tooltip
                  contentStyle={tooltipStyle}
                  formatter={(value, name) => {
                    const total = fundsSplit.total || 0;
                    const v = Number(value) || 0;
                    const pct = total > 0 ? ((v / total) * 100).toFixed(1) : "0.0";
                    return [`${pct}%`, name];
                  }}
                />
                <Legend />
                <Pie data={fundsSplit.pie} dataKey="value" nameKey="name" innerRadius={55} outerRadius={95} paddingAngle={0}>
                  {fundsSplit.pie.map((slice) => (
                    <Cell key={slice.name} fill={slice.fill} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </section>

      </div>
      </div>
    </div>
  );
}

