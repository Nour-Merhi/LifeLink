import { useState, useEffect, useRef } from "react";
import api from "../../api/axios";

/**
 * Loads certificate image via API (with auth) and displays it.
 * Use when public image_url may not work (e.g. cross-origin, ephemeral storage).
 */
export default function CertificateImage({
  certificateId,
  imagePath,
  imageUrl,
  alt = "Certificate",
  className = "",
  fallbackClassName = "",
  isAdmin = false,
  onError,
}) {
  const [blobUrl, setBlobUrl] = useState(null);
  const [loading, setLoading] = useState(!!certificateId && !!imagePath);
  const [failed, setFailed] = useState(false);
  const blobUrlRef = useRef(null);

  useEffect(() => {
    if (!certificateId || !imagePath) {
      setLoading(false);
      setBlobUrl(null);
      return;
    }
    setLoading(true);
    setFailed(false);
    setBlobUrl(null);
    let revoked = false;
    const url = isAdmin
      ? `/api/admin/dashboard/certificates/${certificateId}/image`
      : `/api/donor/certificates/${certificateId}/image`;
    api
      .get(url, { responseType: "blob" })
      .then((res) => {
        if (revoked) return;
        const blob = res.data;
        if (blob && blob.size > 0) {
          const objectUrl = URL.createObjectURL(blob);
          blobUrlRef.current = objectUrl;
          setBlobUrl(objectUrl);
          setFailed(false);
        } else {
          setFailed(true);
        }
      })
      .catch(() => {
        if (!revoked) setFailed(true);
      })
      .finally(() => {
        if (!revoked) setLoading(false);
      });
    return () => {
      revoked = true;
      if (blobUrlRef.current) {
        URL.revokeObjectURL(blobUrlRef.current);
        blobUrlRef.current = null;
      }
    };
  }, [certificateId, imagePath, isAdmin]);

  if (blobUrl) {
    return (
      <img
        src={blobUrl}
        alt={alt}
        className={className}
        onError={(e) => {
          e.target.style.display = "none";
          setFailed(true);
          onError?.(e);
        }}
      />
    );
  }

  if (loading) {
    return (
      <div className={fallbackClassName || className} style={{ minHeight: 40, background: "#f3f4f6", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <span style={{ fontSize: 12, color: "#6b7280" }}>Loading…</span>
      </div>
    );
  }

  if (failed && imageUrl) {
    return (
      <img
        src={imageUrl}
        alt={alt}
        className={className}
        onError={(e) => {
          e.target.style.display = "none";
          onError?.(e);
        }}
      />
    );
  }

  if (failed || (!loading && !blobUrl && certificateId && imagePath)) {
    return (
      <span className={fallbackClassName} style={{ fontSize: 12, color: "#6b7280" }}>
        No image
      </span>
    );
  }

  return null;
}
