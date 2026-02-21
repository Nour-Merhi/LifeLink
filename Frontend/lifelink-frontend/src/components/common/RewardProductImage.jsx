import { useState, useEffect, useRef } from "react";
import api from "../../api/axios";

/**
 * Loads reward product image via API and displays it.
 * Use when public image URL may not work (e.g. cross-origin, ephemeral storage on Railway).
 * usePublicEndpoint: use public route (for ProductRewards page); otherwise admin route (for RewardShop).
 */
export default function RewardProductImage({
  productId,
  imagePath,
  alt = "Product",
  className = "",
  style = {},
  fallback = null,
  usePublicEndpoint = false,
}) {
  const [blobUrl, setBlobUrl] = useState(null);
  const [loading, setLoading] = useState(!!productId && !!imagePath);
  const [failed, setFailed] = useState(false);
  const blobUrlRef = useRef(null);

  const imageUrl = usePublicEndpoint
    ? `/api/rewards/products/${productId}/image`
    : `/api/admin/dashboard/reward-products/${productId}/image`;

  useEffect(() => {
    if (!productId || !imagePath) {
      setLoading(false);
      setBlobUrl(null);
      return;
    }
    setLoading(true);
    setFailed(false);
    setBlobUrl(null);
    let revoked = false;
    api
      .get(imageUrl, { responseType: "blob" })
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
  }, [productId, imagePath, imageUrl]);

  if (blobUrl) {
    return (
      <img
        src={blobUrl}
        alt={alt}
        className={className}
        style={style}
        onError={() => setFailed(true)}
      />
    );
  }

  if (loading) {
    return (
      <div
        className={className}
        style={{
          ...style,
          minHeight: style?.height || 44,
          background: "#f3f4f6",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: style?.borderRadius || 8,
        }}
      >
        <span style={{ fontSize: 11, color: "#6b7280" }}>…</span>
      </div>
    );
  }

  if (failed || (!loading && !blobUrl && productId && imagePath)) {
    return fallback !== undefined ? fallback : (
      <span style={{ fontSize: 12, color: "#9ca3af" }}>—</span>
    );
  }

  return null;
}
