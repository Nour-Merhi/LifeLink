import { useEffect, useMemo, useState } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { FiEdit, FiPlus, FiUpload, FiTrash2 } from "react-icons/fi";
import api from "../../api/axios";
import ConfirmDeleteDialog from "../common/ConfirmDeleteDialog";
import RewardProductImage from "../common/RewardProductImage";
import "../../styles/Dashboard.css";

function formatXp(n) {
  try {
    return Number(n || 0).toLocaleString();
  } catch {
    return String(n || 0);
  }
}


function ProductModal({ mode = "create", initial = null, onClose, onSaved }) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState(() => ({
    title: initial?.title || "",
    description: initial?.description || "",
    cost_xp: initial?.cost_xp ?? 0,
    is_active: initial?.is_active ?? true,
    image: null,
  }));

  const onChange = (e) => {
    const { name, value, type, checked, files } = e.target;
    if (type === "checkbox") {
      setForm((p) => ({ ...p, [name]: checked }));
      return;
    }
    if (type === "file") {
      setForm((p) => ({ ...p, image: files?.[0] || null }));
      return;
    }
    setForm((p) => ({ ...p, [name]: value }));
  };

  const save = async () => {
    setSaving(true);
    setError("");
    try {
      await api.get("/sanctum/csrf-cookie");

      if (mode === "create") {
        const fd = new FormData();
        fd.append("title", form.title);
        fd.append("description", form.description);
        fd.append("cost_xp", String(form.cost_xp ?? 0));
        fd.append("is_active", form.is_active ? "1" : "0");
        if (form.image) fd.append("image", form.image);

        await api.post("/api/admin/dashboard/reward-products", fd, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      } else {
        await api.put(`/api/admin/dashboard/reward-products/${initial.id}`, {
          title: form.title,
          description: form.description,
          cost_xp: Number(form.cost_xp || 0),
          is_active: !!form.is_active,
        });
        if (form.image) {
          const fd = new FormData();
          fd.append("image", form.image);
          await api.post(`/api/admin/dashboard/reward-products/${initial.id}/image`, fd, {
            headers: { "Content-Type": "multipart/form-data" },
          });
        }
      }

      onSaved?.();
      onClose?.();
    } catch (e) {
      console.error("Save reward product failed:", e);
      setError(e.response?.data?.message || "Failed to save product");
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="modal">
      <div className="modal-container" style={{ maxWidth: 720 }}>
        <div className="modal-title">
          <h2>{mode === "create" ? "Add Reward Product" : "Edit Reward Product"}</h2>
          <button onClick={onClose} disabled={saving}>
            ✕
          </button>
        </div>

        <div className="modal-form">
          {error ? (
            <div className="error-message" style={{ marginBottom: 12 }}>
              {error}
            </div>
          ) : null}

          <div className="form-group">
            <div>
              <label>Title</label>
              <input name="title" value={form.title} onChange={onChange} placeholder="LifeLink T‑Shirt" />
            </div>
            <div>
              <label>Cost (XP)</label>
              <input name="cost_xp" type="number" min="0" value={form.cost_xp} onChange={onChange} />
            </div>
          </div>

          <div className="form-group">
            <div style={{ width: "100%" }}>
              <label>Description</label>
              <textarea name="description" value={form.description} onChange={onChange} rows={3} />
            </div>
          </div>

          <div className="form-group">
            <div>
              <label style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <input name="is_active" type="checkbox" checked={!!form.is_active} onChange={onChange} />
                Active (visible to donors)
              </label>
            </div>
            <div>
              <label>Image (optional)</label>
              <input name="image" type="file" accept="image/*" onChange={onChange} />
              <small className="muted">If provided, it will upload/replace the product image.</small>
            </div>
          </div>

          <div className="form-submit-btn">
            <button className="submit-btn" type="button" onClick={save} disabled={saving}>
              {saving ? "Saving..." : "Save"}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

export default function RewardShop() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [metrics, setMetrics] = useState({ totals: { orders: 0, xp_total: 0 }, by_product: [] });

  const [modal, setModal] = useState(null); // {mode, product}
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  const fetchAll = async () => {
    setLoading(true);
    setError("");
    try {
      const [pRes, oRes, mRes] = await Promise.all([
        api.get("/api/admin/dashboard/reward-products"),
        api.get("/api/admin/dashboard/reward-orders"),
        api.get("/api/admin/dashboard/reward-orders/metrics"),
      ]);
      setProducts(Array.isArray(pRes.data?.products) ? pRes.data.products : []);
      setOrders(Array.isArray(oRes.data?.orders) ? oRes.data.orders : []);
      setMetrics(mRes.data || { totals: { orders: 0, xp_total: 0 }, by_product: [] });
    } catch (e) {
      console.error("Failed to load reward shop admin data:", e);
      setError(e.response?.data?.message || "Failed to load rewards shop management data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const chartData = useMemo(() => {
    const arr = Array.isArray(metrics?.by_product) ? metrics.by_product : [];
    return arr.map((r) => ({
      name: r.product_title,
      qty: Number(r.qty_total || 0),
    }));
  }, [metrics]);

  return (
    <section className="admin-section">
      <div className="dashboard-title">
        <div>
          <div className="icon-title">
            <h2>Reward Shop</h2>
          </div>
          <p>Manage product rewards, XP prices, images, and donor purchases.</p>
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button className="submit-btn" type="button" onClick={() => setModal({ mode: "create" })}>
            <FiPlus style={{ marginRight: 8 }} />
            Add Product
          </button>
          <button className="btn-cancel" type="button" onClick={fetchAll} disabled={loading}>
            Refresh
          </button>
        </div>
      </div>

      {error ? (
        <div className="control-panel" style={{ marginBottom: 14, backgroundColor: "#FDE8E8", border: "1px solid #E92C30" }}>
          <p style={{ color: "#E92C30", margin: 0 }}>{error}</p>
        </div>
      ) : null}

      {/* Metrics + chart */}
      <div className="donor-container" style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
          <div className="p-5">
            <h3 style={{ margin: 0 }}>Purchases summary</h3>
            <p className="muted" style={{ marginTop: 6 }}>
              Total orders: <strong>{Number(metrics?.totals?.orders || 0)}</strong> · Total XP spent:{" "}
              <strong>{formatXp(metrics?.totals?.xp_total || 0)}</strong>
            </p>
          </div>
        </div>

        <div style={{ height: 260, marginTop: 10, padding: "0 10px" }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="qty" fill="#F12C31" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Products list */}
      <div className="table-design" style={{ marginBottom: 18 }}>
        <div className="p-5">
          <div className="control-panel-layout" style={{ justifyContent: "space-between" }}>
            <div>
              <h3 style={{ margin: 0 }}>Products</h3>
              <small className="muted">These are the products visible in the public Product Rewards page.</small>
            </div>
          </div>
        </div>

        <div className="table-overflow-x">
          <table className="h1-table">
            <thead>
              <tr>
                <th>Image</th>
                <th>Title</th>
                <th>Cost (XP)</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: "center", padding: 24, color: "#6B6B6B" }}>
                    No products found.
                  </td>
                </tr>
              ) : (
                products.map((p) => (
                  <tr key={p.id}>
                    <td style={{ width: 90 }}>
                      {p.image_path ? (
                        <RewardProductImage
                          productId={p.id}
                          imagePath={p.image_path}
                          alt={p.title}
                          style={{ width: 60, height: 44, objectFit: "cover", borderRadius: 10, border: "1px solid rgba(0,0,0,0.08)" }}
                          fallback={<span className="muted">—</span>}
                        />
                      ) : (
                        <span className="muted">—</span>
                      )}
                    </td>
                    <td>
                      <strong>{p.title}</strong>
                      <div className="muted" style={{ fontSize: 12, marginTop: 4 }}>
                        {p.description || ""}
                      </div>
                    </td>
                    <td style={{ fontWeight: 800 }}>{formatXp(p.cost_xp)} XP</td>
                    <td>
                      <span className={`badge ${p.is_active ? "badge-success" : "badge-danger"}`}>
                        {p.is_active ? "Active" : "Hidden"}
                      </span>
                    </td>
                    <td>
                      <div className="row-actions">
                        <button className="icon-btn text-green-600" title="Edit" onClick={() => setModal({ mode: "edit", product: p })}>
                          <FiEdit />
                        </button>
                        <button className="icon-btn text-blue-800" title="Upload image" onClick={() => setModal({ mode: "edit", product: p })}>
                          <FiUpload />
                        </button>
                        <button
                          className="icon-btn text-red-500"
                          title="Delete"
                          onClick={() => {
                            setDeleteConfirm({ id: p.id, title: p.title });
                            setDeleteError("");
                          }}
                        >
                          <FiTrash2 />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Purchases table */}
      <div className="table-design">
        <div className="p-5">
          <div className="control-panel-layout" style={{ justifyContent: "space-between" }}>
            <div>
              <h3 style={{ margin: 0 }}>Donor purchases</h3>
              <small className="muted">Latest 250 orders.</small>
            </div>
          </div>
        </div>

        <div className="table-overflow-x">
          <table className="h1-table">
            <thead>
              <tr>
                <th>Order</th>
                <th>Donor</th>
                <th>Items</th>
                <th>XP spent</th>
                <th>Status</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {orders.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: "center", padding: 24, color: "#6B6B6B" }}>
                    No purchases yet.
                  </td>
                </tr>
              ) : (
                orders.map((o) => (
                  <tr key={o.id}>
                    <td>
                      <strong>{o.code}</strong>
                    </td>
                    <td>
                      <div className="cell-title">
                        <span style={{ fontWeight: 700 }}>{o?.donor?.name || "N/A"}</span>
                        <small className="muted">
                          {o?.donor?.email || "—"} {o?.donor?.phone_nb ? `· ${o.donor.phone_nb}` : ""}
                        </small>
                      </div>
                    </td>
                    <td style={{ minWidth: 220 }}>
                      <div style={{ display: "grid", gap: 4 }}>
                        {(o.items || []).slice(0, 3).map((it) => (
                          <div key={it.id} className="muted" style={{ fontSize: 12 }}>
                            {it.product_title} × {it.qty}
                          </div>
                        ))}
                        {(o.items || []).length > 3 ? <div className="muted">+{(o.items || []).length - 3} more…</div> : null}
                      </div>
                    </td>
                    <td style={{ fontWeight: 900 }}>{formatXp(o.total_xp_spent)} XP</td>
                    <td>
                      <span className="badge badge-pending">{o.status}</span>
                    </td>
                    <td className="muted" style={{ fontSize: 12 }}>
                      {o.created_at ? new Date(o.created_at).toLocaleString() : "—"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {modal ? (
        <ProductModal
          mode={modal.mode}
          initial={modal.product || null}
          onClose={() => setModal(null)}
          onSaved={fetchAll}
        />
      ) : null}

      {deleteConfirm ? (
        <ConfirmDeleteDialog
          title="Delete Product"
          description="This will remove the product from the donor shop. Existing purchase history will remain."
          details={deleteConfirm.title}
          loading={deleteLoading}
          error={deleteError}
          onClose={() => {
            if (deleteLoading) return;
            setDeleteConfirm(null);
            setDeleteError("");
          }}
          onConfirm={async () => {
            setDeleteLoading(true);
            setDeleteError("");
            try {
              await api.get("/sanctum/csrf-cookie");
              await api.delete(`/api/admin/dashboard/reward-products/${deleteConfirm.id}`);
              setDeleteConfirm(null);
              await fetchAll();
            } catch (e) {
              console.error("Delete product failed:", e);
              setDeleteError(e.response?.data?.message || "Failed to delete product");
            } finally {
              setDeleteLoading(false);
            }
          }}
        />
      ) : null}
    </section>
  );
}

