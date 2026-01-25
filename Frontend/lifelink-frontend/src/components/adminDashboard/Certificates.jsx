import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { RiFileList3Line } from "react-icons/ri";
import { MdCardGiftcard } from "react-icons/md";
import { HiUserGroup } from "react-icons/hi";
import { FiPlus } from "react-icons/fi";
import api from "../../api/axios";
import CertificateTable from "./certificateComponents/CertificateTable";
import "../../styles/Dashboard.css";
import "../../styles/Certificates.css";

export default function Certificates() {
  const [certificates, setCertificates] = useState([]);
  const [metrics, setMetrics] = useState({
    total_certificates: 0,
    certificates_this_month: 0,
    donors_with_certificates: 0,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchCertificates = () => {
    setLoading(true);
    setError("");
    api
      .get("/api/admin/dashboard/certificates")
      .then((res) => {
        setCertificates(res.data.certificates || []);
        setMetrics(res.data.metrics || {
          total_certificates: 0,
          certificates_this_month: 0,
          donors_with_certificates: 0,
        });
      })
      .catch((err) => {
        setError(err.response?.data?.message || "Failed to fetch certificates");
        setCertificates([]);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchCertificates();
  }, []);

  const metricCards = [
    {
      title: "Total Certificates",
      value: metrics.total_certificates,
      sub: "All time",
      icon: <RiFileList3Line />,
      bg: "#EBEAFF",
      color: "#285BFF",
    },
    {
      title: "This Month",
      value: metrics.certificates_this_month,
      sub: "Generated this month",
      icon: <MdCardGiftcard />,
      bg: "#FFE5E5",
      color: "#F12C31",
    },
    {
      title: "Donors with Certificates",
      value: metrics.donors_with_certificates,
      sub: "Unique donors",
      icon: <HiUserGroup />,
      bg: "#EAFFE5",
      color: "#16a34a",
    },
  ];

  return (
    <section className="financial-section">
      <div className="dashboard-title">
        <div>
          <div className="icon-title">
            <RiFileList3Line className="icon-size" />
            <h2>Certificates</h2>
          </div>
          <p>Manage and issue donor certificates</p>
        </div>
        <div className="add-btn">
          <Link
            to="/admin/certificates/generate"
            className="btn-generate-certificate"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.5rem",
              padding: "0.5rem 1rem",
              background: "#F12C31",
              color: "#fff",
              borderRadius: "8px",
              fontWeight: 600,
              textDecoration: "none",
              fontSize: "14px",
            }}
          >
            <FiPlus /> Generate Certificate
          </Link>
        </div>
      </div>

      <div className="certificates-metrics">
        {metricCards.map((m) => (
          <div key={m.title} className="certificates-metric-card">
            <div
              className="certificates-metric-icon"
              style={{ backgroundColor: m.bg, color: m.color }}
            >
              {m.icon}
            </div>
            <div className="certificates-metric-content">
              <h4>{m.value}</h4>
              <span>{m.title}</span>
              <span style={{ display: "block", marginTop: 2 }}>{m.sub}</span>
            </div>
          </div>
        ))}
      </div>

      <CertificateTable
        certificates={certificates}
        loading={loading}
        error={error}
        onCertificatesUpdate={fetchCertificates}
      />
    </section>
  );
}
