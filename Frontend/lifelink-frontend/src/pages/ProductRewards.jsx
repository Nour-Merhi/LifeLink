import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { FiSearch, FiShoppingCart, FiX, FiMinus, FiPlus, FiCheck } from "react-icons/fi";
import { LiaTshirtSolid } from "react-icons/lia";
import { GiCoffeeCup } from "react-icons/gi";
import { FaRegStickyNote } from "react-icons/fa";
import { IoShirtOutline } from "react-icons/io5";
import { TbGift } from "react-icons/tb";
import Navbar from "../components/Navbar.jsx";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";
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

function resolveImageSrc(imagePath) {
  if (!imagePath) return null;
  const baseURL = api?.defaults?.baseURL || "http://localhost:8000";
  const img = String(imagePath);
  if (img.startsWith("http")) return img;
  return `${baseURL}${img.startsWith("/") ? "" : "/"}${img}`;
}

export default function ProductRewards() {
  const { user } = useAuth();
  const isGuest = !user;

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
        setError(e.response?.data?.message || "Failed to load rewards shop");
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
    try {
      await api.get("/sanctum/csrf-cookie");
      const res = await api.post("/api/donor/rewards/purchase", { items });
      setXp(Number(res.data?.current_xp || 0));
      setSuccessMsg(res.data?.message || "Purchase successful. Please pick up your items from the LifeLink Center.");
      setSuccessOpen(true);
      return true;
    } catch (e) {
      console.error("Purchase failed:", e);
      const msg = e.response?.data?.message || "Purchase failed";
      setError(msg);
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
                    <img
                      src={resolveImageSrc(p.image_path)}
                      alt={p.title}
                      loading="lazy"
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                      }}
                    />
                  ) : null}
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