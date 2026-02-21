import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { FiSearch, FiShoppingCart, FiX, FiMinus, FiPlus, FiCheck } from "react-icons/fi";
import { TbGift } from "react-icons/tb";
import Navbar from "../components/Navbar.jsx";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";
import RewardProductImage from "../components/common/RewardProductImage";
import "../styles/ProductRewards.css";

function formatXp(n) {
  try {
    return Number(n || 0).toLocaleString();
  } catch {
    return String(n || 0);
  }
}

function iconForProduct(title = "") {
  return <TbGift size={22} />;
}

export default function ProductRewards() {
  const { user, loading: authLoading } = useAuth();
  const isGuest = !authLoading && !user;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [xp, setXp] = useState(0);
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState("");

  const [cartOpen, setCartOpen] = useState(false);
  const [cart, setCart] = useState([]); 
  const [busy, setBusy] = useState(false);

  const [toast, setToast] = useState(null);
  const toastTimer = useRef(null);

  const [successOpen, setSuccessOpen] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  useEffect(() => {
    const fetchShop = async () => {
      try {
        setLoading(true);
        setError("");
        if (isGuest) {
          const res = await api.get("/api/rewards/shop-public");
          setXp(0);
          setProducts(Array.isArray(res.data?.products) ? res.data.products : []);
        } else {
          const res = await api.get("/api/donor/rewards/shop");
          setXp(Number(res.data?.current_xp || 0));
          setProducts(Array.isArray(res.data?.products) ? res.data.products : []);
        }
      } catch (e) {
        const status = e.response?.status;
        const data = e.response?.data;
        if (status === 401) {
          setError("Session expired. Please log in again to purchase rewards.");
          // Still show products from public catalog so user can see what's available
          try {
            const pub = await api.get("/api/rewards/shop-public");
            setProducts(Array.isArray(pub.data?.products) ? pub.data.products : []);
          } catch (_) {}
        } else if (status === 404 && data?.error === "donor_not_found") {
          setError("Rewards are only available for donors. Please register as a donor to earn and spend XP.");
        } else {
          setError(data?.message || "Failed to load rewards shop");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchShop();
  }, [isGuest]);

  useEffect(() => {
    return () => {
      if (toastTimer.current) clearTimeout(toastTimer.current);
    };
  }, []);

  const filtered = useMemo(() => {
    const s = search.trim().toLowerCase();
    if (!s) return products;
    return products.filter((p) => {
      const t = String(p?.title || "").toLowerCase();
      const d = String(p?.description || "").toLowerCase();
      return t.includes(s) || d.includes(s);
    });
  }, [products, search]);

  const cartTotal = useMemo(() => {
    return cart.reduce((sum, it) => sum + Number(it.cost_xp || 0) * Number(it.qty || 0), 0);
  }, [cart]);

  const remaining = xp - cartTotal;
  const canCheckout = cart.length > 0 && cartTotal <= xp && !busy;

  const showToast = (message) => {
    setToast(message);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 1400);
  };

  const addToCart = (p) => {
    const cost = Number(p?.cost_xp || 0);
    if (cost > xp) return;
    setCart((prev) => {
      const idx = prev.findIndex((x) => x.id === p.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = { ...next[idx], qty: Number(next[idx].qty || 0) + 1 };
        return next;
      }
      return [...prev, { id: p.id, title: p.title, cost_xp: p.cost_xp, qty: 1 }];
    });
    showToast("Added to cart");
  };

  const changeQty = (id, delta) => {
    setCart((prev) => {
      const next = prev
        .map((it) => (it.id === id ? { ...it, qty: Math.max(0, Number(it.qty || 0) + delta) } : it))
        .filter((it) => it.qty > 0);
      return next;
    });
  };

  const purchaseItems = async (items) => {
    setBusy(true);
    setError("");
    try {
      const res = await api.post("/api/donor/rewards/purchase", { items });
      setXp(Number(res.data?.current_xp ?? 0));
      setSuccessMsg(res.data?.message || "Purchase successful. Please pick up your items from the LifeLink Center.");
      setSuccessOpen(true);
      return true;
    } catch (e) {
      const status = e.response?.status;
      const data = e.response?.data;
      let msg = "Purchase failed";
      if (!e.response) {
        msg = "Network error. Please check your connection and try again.";
      } else if (status === 401) {
        msg = "Session expired. Please log in again to purchase.";
      } else if (status === 404 && data?.error === "donor_not_found") {
        msg = "Rewards are only available for donors. Please register as a donor to earn and spend XP.";
      } else if (status === 422) {
        msg = data?.message || "Purchase could not be completed.";
      } else if (data?.message) {
        msg = data.message;
      } else if (data?.errors && typeof data.errors === "object") {
        const first = Object.values(data.errors).flat()[0];
        if (first) msg = first;
      } else if (data?.error && status !== 404) {
        msg = String(data.error);
      }
      if (data?.error_detail) {
        msg += ` (${data.error_detail})`;
      }
      setError(msg);
      // Sync XP from response so UI shows correct balance (e.g. insufficient XP)
      const responseXp = data?.current_xp;
      if (typeof responseXp === "number" || (typeof responseXp === "string" && responseXp !== "")) {
        setXp(Number(responseXp));
      }
      console.error("Purchase failed:", status, data, e.message);
      return false;
    } finally {
      setBusy(false);
    }
  };

  const buyNow = async (p) => {
    const cost = Number(p?.cost_xp || 0);
    if (cost > xp) return;
    const ok = await purchaseItems([{ product_id: p.id, qty: 1 }]);
    if (ok) {
      showToast("Purchased");
    }
  };

  const checkout = async () => {
    if (!canCheckout) return;
    const items = cart.map((it) => ({ product_id: it.id, qty: it.qty }));
    const ok = await purchaseItems(items);
    if (ok) {
      setCart([]);
      setCartOpen(false);
    }
  };

  if (loading) {
    return (
      <section className="rewards-store">
        <Navbar />
        <div className="rewards-store-container">
          <div style={{ padding: "40px 0", color: "#6b7280" }}>Loading rewards shop…</div>
        </div>
      </section>
    );
  }

  return (
    <section className="rewards-store">
      <Navbar />
      <div className="rewards-store-container">
        <div className="rewards-store-hero">
          <div>
            <div className="rewards-store-title">Rewards Store</div>
            <div className="rewards-store-subtitle">
              Spend your XP on LifeLink rewards. Eligible products are enabled automatically based on your XP balance.
              After purchasing, pick up your items from the LifeLink Center.
            </div>
          </div>

          {!isGuest && (
            <div className="xp-pill" title="Your XP balance">
              <span className="xp-value">{formatXp(xp)} XP</span>
              <strong>available</strong>
            </div>
          )}
        </div>

        {isGuest && (
          <div className="rewards-guest-note" role="status">
            Please <Link to="/login">log in</Link> to purchase rewards.
          </div>
        )}

        <div className="rewards-toolbar">
          <div className="rewards-search">
            <FiSearch />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search products…"
              aria-label="Search products"
            />
          </div>

          {!isGuest && (
            <button className="cart-btn" onClick={() => setCartOpen(true)} type="button">
              <FiShoppingCart />
              Cart
              <span style={{ opacity: 0.85 }}>({cart.length})</span>
            </button>
          )}
        </div>

        {error ? (
          <div style={{ padding: "10px 12px", borderRadius: 12, background: "#FDE8E8", border: "1px solid #E92C30", color: "#B42318" }}>
            {error}
          </div>
        ) : null}

        <div className="products-grid">
          {filtered.map((p) => {
            const cost = Number(p?.cost_xp || 0);
            const disabled = isGuest || cost > xp;
            const guestDisabled = isGuest;
            return (
              <div key={p.id} className={`product-card ${disabled ? "disabled" : ""}`}>
                {guestDisabled ? (
                  <div className="disabled-badge">Log in to purchase</div>
                ) : disabled ? (
                  <div className="disabled-badge">Not enough XP</div>
                ) : null}

                <div className="product-image">
                  {p?.image_path ? (
                    <RewardProductImage
                      productId={p.id}
                      imagePath={p.image_path}
                      usePublicEndpoint
                      alt={p.title}
                      className="product-image-img"
                      fallback={
                        <div className="product-image-placeholder" aria-hidden>
                          {iconForProduct(p.title)}
                        </div>
                      }
                    />
                  ) : (
                    <div className="product-image-placeholder" aria-hidden>
                      {iconForProduct(p.title)}
                    </div>
                  )}
                </div>

                <div className="product-top">
                  <div style={{ display: "flex", gap: 12 }}>
                    <div className="product-icon">{iconForProduct(p.title)}</div>
                    <div>
                      <div className="product-title">{p.title}</div>
                      <div className="product-desc">{p.description}</div>
                    </div>
                  </div>
                  <div className="product-cost">{formatXp(cost)} XP</div>
                </div>

                <div className="product-actions">
                  <button
                    className="btn-ghost"
                    type="button"
                    disabled={disabled || busy}
                    onClick={() => !guestDisabled && addToCart(p)}
                    title={guestDisabled ? "Log in to purchase" : disabled ? "You don't have enough XP" : "Add to cart"}
                  >
                    Add to cart
                  </button>
                  <button
                    className="btn-primary"
                    type="button"
                    disabled={disabled || busy}
                    onClick={() => !guestDisabled && buyNow(p)}
                    title={guestDisabled ? "Log in to purchase" : disabled ? "You don't have enough XP" : "Buy now"}
                  >
                    Buy now
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {cartOpen ? (
        <div className="cart-overlay" onClick={() => setCartOpen(false)} role="presentation">
          <div className="cart-drawer" onClick={(e) => e.stopPropagation()} role="dialog" aria-label="Cart">
            <div className="cart-header">
              <div className="cart-title">Your Cart</div>
              <button className="cart-close" type="button" onClick={() => setCartOpen(false)} aria-label="Close cart">
                <FiX />
              </button>
            </div>

            <div className="cart-summary">
              <div className="muted">XP balance</div>
              <strong>{formatXp(xp)} XP</strong>
            </div>
            <div className="cart-summary">
              <div className="muted">Cart total</div>
              <strong>{formatXp(cartTotal)} XP</strong>
            </div>
            <div className="cart-summary">
              <div className="muted">Remaining</div>
              <strong style={{ color: remaining >= 0 ? "#111827" : "#B42318" }}>{formatXp(remaining)} XP</strong>
            </div>

            <div className="cart-items">
              {cart.length === 0 ? (
                <div style={{ padding: "12px 0", color: "#6b7280" }}>Your cart is empty.</div>
              ) : (
                cart.map((it) => (
                  <div key={it.id} className="cart-item">
                    <div className="cart-item-left">
                      <div className="product-icon" style={{ width: 40, height: 40 }}>
                        {iconForProduct(it.title)}
                      </div>
                      <div>
                        <div className="cart-item-name">{it.title}</div>
                        <div className="cart-item-meta">
                          {formatXp(it.cost_xp)} XP each · {formatXp(Number(it.cost_xp) * Number(it.qty))} XP
                        </div>
                      </div>
                    </div>

                    <div className="qty-controls">
                      <button className="qty-btn" type="button" onClick={() => changeQty(it.id, -1)} aria-label="Decrease">
                        <FiMinus />
                      </button>
                      <div className="qty-value">{it.qty}</div>
                      <button className="qty-btn" type="button" onClick={() => changeQty(it.id, +1)} aria-label="Increase">
                        <FiPlus />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="cart-footer">
              <button className="checkout-btn" type="button" disabled={!canCheckout} onClick={checkout}>
                {busy ? "Processing…" : "Checkout with XP"}
              </button>
              <div style={{ marginTop: 10, color: "#6b7280", fontSize: 12, lineHeight: 1.5 }}>
                After purchase, you can pick up your items from the <strong>LifeLink Center</strong>.
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {toast ? (
        <div className="toast" role="status" aria-live="polite">
          <span className="toast-check">
            <FiCheck />
          </span>
          <span>{toast}</span>
        </div>
      ) : null}

      {successOpen ? (
        <div className="success-modal-overlay" role="presentation" onClick={() => setSuccessOpen(false)}>
          <div className="success-modal" role="dialog" aria-label="Purchase successful" onClick={(e) => e.stopPropagation()}>
            <div className="checkmark">
              <FiCheck size={26} />
            </div>
            <div className="success-title">Purchase successful</div>
            <div className="success-text">{successMsg}</div>
            <div className="success-actions">
              <button type="button" onClick={() => setSuccessOpen(false)}>
                OK
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}