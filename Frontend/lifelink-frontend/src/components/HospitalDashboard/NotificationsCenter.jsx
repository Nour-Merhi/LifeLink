import { useEffect, useMemo, useState } from "react";
import { MdNotificationsActive } from "react-icons/md";
import { IoPerson } from "react-icons/io5";
import { FaReply } from "react-icons/fa";
import api from "../../api/axios";
import "../../styles/Dashboard.css";

export default function NotificationsCenter() {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [phlebotomists, setPhlebotomists] = useState([]);
    const [messages, setMessages] = useState([]);
    const [activeTab, setActiveTab] = useState("all"); // 'all' | sender_user_id

    const [showReplyModal, setShowReplyModal] = useState(false);
    const [replyingTo, setReplyingTo] = useState(null); // message object
    const [replyForm, setReplyForm] = useState({ subject: "", body: "" });
    const [sendingReply, setSendingReply] = useState(false);

    useEffect(() => {
        // Opening the message center implies the manager has viewed messages
        // (also clears the navbar badge even if user navigated here via sidebar).
        markAllAsReadAndRefresh();
    }, []);

    const markAllAsReadAndRefresh = async () => {
        try {
            await api.post("/api/hospital/dashboard/messages/phlebotomists-mark-read");
        } catch (e) {
            // ignore (still allow viewing messages)
        } finally {
            fetchMessages();
        }
    };

    const fetchMessages = async () => {
        try {
            setLoading(true);
            setError("");
            const res = await api.get("/api/hospital/dashboard/messages/phlebotomists");
            setPhlebotomists(res.data.phlebotomists || []);
            setMessages(res.data.messages || []);
        } catch (err) {
            console.error("Error fetching phlebotomist messages:", err);
            setError(err.response?.data?.message || "Failed to load messages");
        } finally {
            setLoading(false);
        }
    };

    const phlebTabs = useMemo(() => {
        const msgs = messages || [];
        if (msgs.length === 0) return [];

        // Build set of phlebotomist user IDs (full list), but only show those who appear in messages
        const phlebNameByUserId = new Map((phlebotomists || []).map((p) => [String(p.user_id), p.name || "Phlebotomist"]));
        const phlebUserIdSet = new Set((phlebotomists || []).map((p) => String(p.user_id)));

        const agg = new Map(); // phleb_user_id -> { id, label, count }
        for (const m of msgs) {
            const senderId = String(m.sender_user_id);
            const receiverId = String(m.receiver_user_id);

            // Conversation participant (phlebotomist) might be sender or receiver depending on direction
            const phlebId = phlebUserIdSet.has(senderId) ? senderId : (phlebUserIdSet.has(receiverId) ? receiverId : null);
            if (!phlebId) continue;

            const existing = agg.get(phlebId);
            const labelFromMessage = (phlebId === senderId ? (m.senderName || null) : (m.receiverName || null));
            const label = labelFromMessage || phlebNameByUserId.get(phlebId) || "Phlebotomist";

            if (existing) {
                existing.count += 1;
                if (existing.label === "Phlebotomist" && label !== "Phlebotomist") {
                    existing.label = label;
                }
            } else {
                agg.set(phlebId, { id: phlebId, label, count: 1 });
            }
        }

        return Array.from(agg.values()).sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
    }, [phlebotomists, messages]);

    const filteredMessages = useMemo(() => {
        if (activeTab === "all") return messages || [];
        const id = String(activeTab);
        return (messages || []).filter((m) => String(m.sender_user_id) === id || String(m.receiver_user_id) === id);
    }, [messages, activeTab]);

    const allCount = (messages || []).length;

    const handleOpenReply = (message) => {
        const subject = message?.subject ? `Re: ${message.subject}` : "Re:";
        setReplyingTo(message);
        setReplyForm({ subject, body: "" });
        setShowReplyModal(true);
    };

    const handleCloseReply = () => {
        if (sendingReply) return;
        setShowReplyModal(false);
        setReplyingTo(null);
        setReplyForm({ subject: "", body: "" });
    };

    const handleSendReply = async (e) => {
        e.preventDefault();
        if (!replyingTo?.sender_user_id) return;
        if (!replyForm.subject.trim() || !replyForm.body.trim()) return;

        try {
            setSendingReply(true);
            const res = await api.post("/api/hospital/dashboard/messages/phlebotomists", {
                receiver_user_id: replyingTo.sender_user_id,
                subject: replyForm.subject,
                body: replyForm.body,
            });

            const created = res.data?.data;
            if (created) {
                setMessages((prev) => [created, ...(prev || [])]);
                // Keep the current tab; if we are not on "all", ensure it matches the conversation partner
                if (activeTab !== "all") {
                    const partnerId = String(replyingTo.sender_user_id);
                    setActiveTab(partnerId);
                }
            } else {
                // Fallback: refetch
                await fetchMessages();
            }

            handleCloseReply();
        } catch (err) {
            console.error("Error sending reply:", err);
            const msg = err.response?.data?.message || "Failed to send reply";
            alert(msg);
        } finally {
            setSendingReply(false);
        }
    };

    if (loading) {
        return (
            <div className="nurse-section flex items-center justify-center h-64">
                <p className="text-gray-500">Loading messages...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="nurse-section flex flex-col items-center justify-center h-64 p-4">
                <p className="text-red-500 text-lg font-semibold mb-2">Error: {error}</p>
                <p className="text-gray-600 text-sm">Please try again or contact support.</p>
            </div>
        );
    }

    return (
        <section className="notification-section">
            <div className="dashboard-title">
                <div>
                    <div className="icon-title">
                        <MdNotificationsActive className="icon-size" />
                        <h2>Messages</h2>
                    </div>
                    <p>Messages sent by your phlebotomists</p>
                </div>
            </div>

            <div className="financial-tabs" style={{ overflowX: "auto", whiteSpace: "nowrap" }}>
                <button
                    className={activeTab === "all" ? "tab-active-nurse" : "tab-inactive"}
                    onClick={() => setActiveTab("all")}
                >
                    All ({allCount})
                </button>
                {phlebTabs.map((t) => {
                    return (
                        <button
                            key={t.id}
                            className={String(activeTab) === String(t.id) ? "tab-active-nurse" : "tab-inactive"}
                            onClick={() => setActiveTab(t.id)}
                            title={t.label}
                        >
                            {t.label} ({t.count})
                        </button>
                    );
                })}
            </div>

            <div className="message-card-container" style={{ marginTop: "20px" }}>
                {filteredMessages.length > 0 ? (
                    filteredMessages.map((message) => (
                        <div key={message.id} className="donor-container message-card">
                            <div className="message-card-left">
                                <div className="flex flex-row align-items-center gap-5">
                                    <div className="message-card-icon">
                                        <IoPerson />
                                    </div>
                                    <div className="message-card-content">
                                        <div className="message-header">
                                            <h3>{message.senderName || "Phlebotomist"}</h3>
                                            <p className="message-date">{message.date || "N/A"}</p>
                                        </div>
                                    </div>

                                    {!message.is_sent_by_me && (
                                        <div className="message-card-actions">
                                            <button
                                                className="reply-button"
                                                onClick={() => handleOpenReply(message)}
                                                title="Reply"
                                                style={{ display: "flex", alignItems: "center", gap: "8px" }}
                                            >
                                                <FaReply />
                                                Reply
                                            </button>
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <h4 className="!m-0">{message.subject || "N/A"}</h4>
                                    <p className="!text-[16px]">{message.body || "N/A"}</p>
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="donor-container" style={{ padding: "40px", textAlign: "center" }}>
                        <p className="text-gray-500 text-lg">No messages found</p>
                        <p className="text-gray-400 text-sm mt-2">
                            {activeTab === "all" ? "No phlebotomist messages yet." : "No messages for this phlebotomist."}
                        </p>
                    </div>
                )}
            </div>

            {showReplyModal && replyingTo && (
                <div
                    className="modal"
                    onClick={handleCloseReply}
                    style={{
                        position: "fixed",
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: "rgba(0,0,0,0.5)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        zIndex: 1000,
                    }}
                >
                    <div
                        className="modal-container"
                        onClick={(e) => e.stopPropagation()}
                        style={{
                            backgroundColor: "white",
                            padding: "30px",
                            borderRadius: "10px",
                            maxWidth: "650px",
                            width: "90%",
                            maxHeight: "90vh",
                            overflow: "auto",
                        }}
                    >
                        <div className="modal-title" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px" }}>
                            <div>
                                <h2 style={{ margin: 0 }}>Reply</h2>
                                <p style={{ margin: "6px 0 0 0", color: "#6b7280", fontSize: "14px" }}>
                                    To: {replyingTo.senderName || "Phlebotomist"}
                                </p>
                            </div>
                            <button
                                onClick={handleCloseReply}
                                disabled={sendingReply}
                                style={{ background: "none", border: "none", fontSize: "24px", cursor: "pointer" }}
                                aria-label="Close reply modal"
                            >
                                ×
                            </button>
                        </div>

                        <form onSubmit={handleSendReply}>
                            <div style={{ marginBottom: "16px" }}>
                                <label style={{ display: "block", marginBottom: "8px", fontWeight: 600 }}>Subject</label>
                                <input
                                    type="text"
                                    value={replyForm.subject}
                                    onChange={(e) => setReplyForm((p) => ({ ...p, subject: e.target.value }))}
                                    placeholder="Enter subject"
                                    required
                                    style={{ width: "100%", padding: "10px", border: "1px solid #ccc", borderRadius: "5px" }}
                                />
                            </div>
                            <div style={{ marginBottom: "18px" }}>
                                <label style={{ display: "block", marginBottom: "8px", fontWeight: 600 }}>Message</label>
                                <textarea
                                    value={replyForm.body}
                                    onChange={(e) => setReplyForm((p) => ({ ...p, body: e.target.value }))}
                                    placeholder="Write your reply..."
                                    required
                                    rows={6}
                                    style={{ width: "100%", padding: "10px", border: "1px solid #ccc", borderRadius: "5px", resize: "vertical" }}
                                />
                            </div>

                            <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
                                <button
                                    type="button"
                                    onClick={handleCloseReply}
                                    disabled={sendingReply}
                                    style={{ padding: "10px 20px", border: "1px solid #ccc", borderRadius: "5px", background: "white", cursor: "pointer" }}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={sendingReply}
                                    style={{ padding: "10px 20px", border: "none", borderRadius: "5px", background: "#3257CD", color: "white", cursor: "pointer" }}
                                >
                                    {sendingReply ? "Sending..." : "Send Reply"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </section>
    );
}

