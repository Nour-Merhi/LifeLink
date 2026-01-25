import { useState, useRef, useEffect } from "react";
import { IoClose, IoSend } from "react-icons/io5";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import "../styles/Chatbot.css";

const FALLBACK_REPLY = "I couldn't process that. Please try again.";
const VISITOR_KEY = "chatbot_visitor_id";

function getOrCreateVisitorId() {
  let id = typeof localStorage !== "undefined" ? localStorage.getItem(VISITOR_KEY) : null;
  if (!id && typeof crypto !== "undefined" && crypto.randomUUID) {
    id = crypto.randomUUID();
    localStorage.setItem(VISITOR_KEY, id);
  }
  if (!id) {
    id = "visitor_" + Date.now() + "_" + Math.random().toString(36).slice(2, 11);
    try {
      localStorage.setItem(VISITOR_KEY, id);
    } catch (_) {}
  }
  return id;
}

export default function Chatbot() {
  const navigate = useNavigate();
  const messagesEndRef = useRef(null);
  const [messages, setMessages] = useState([]);
  const [messageInput, setMessageInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const visitorIdRef = useRef(null);

  useEffect(() => {
    visitorIdRef.current = getOrCreateVisitorId();
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleClose = () => {
    navigate("/home");
  };

  const sendMessage = async () => {
    const text = messageInput.trim();
    if (!text || loading) return;

    setError(null);
    setMessageInput("");
    setMessages((prev) => [...prev, { sender: "user", message: text }]);
    setLoading(true);

    try {
      await api.get("/sanctum/csrf-cookie");
      const payload = { message: text };
      if (!visitorIdRef.current) visitorIdRef.current = getOrCreateVisitorId();
      payload.visitor_id = visitorIdRef.current;
      const { data } = await api.post("/api/chatbot", payload);
      const reply = data?.reply ?? FALLBACK_REPLY;
      setMessages((prev) => [...prev, { sender: "bot", message: reply }]);
    } catch (err) {
      setError(err.response?.data?.message || "Something went wrong. Please try again.");
      setMessages((prev) => [
        ...prev,
        { sender: "bot", message: err.response?.data?.message || FALLBACK_REPLY },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="chatbot-page rewards-store">
      <div className="chatbot-container">
        <header className="chatbot-header">
          <div className="chatbot-header-left">
            <span className="chatbot-avatar">AI</span>
            <div>
              <h1 className="chatbot-title">LifeLink Assistant</h1>
            </div>
          </div>
          <button
            type="button"
            className="chatbot-close-btn"
            onClick={handleClose}
            aria-label="Close chatbot"
          >
            <IoClose />
          </button>
        </header>

        <div className="chatbot-main">
          <div className="chatbot-messages">
            {messages.length === 0 && (
              <div className="chatbot-welcome">
                <p>Hi! I&apos;m the LifeLink assistant.</p>
                <p>Ask me about blood donation, organ donation, rewards, or how to use the platform.</p>
              </div>
            )}
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`chatbot-bubble ${msg.sender === "user" ? "chatbot-bubble-user" : "chatbot-bubble-bot"}`}
              >
                {msg.sender === "bot" && <span className="chatbot-bot-label">Assistant</span>}
                <p className="chatbot-bubble-text">{msg.message}</p>
              </div>
            ))}
            {loading && (
              <div className="chatbot-bubble chatbot-bubble-bot chatbot-typing">
                <span className="chatbot-bot-label">Assistant</span>
                <div className="chatbot-dots">
                  <span /><span /><span />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {error && (
            <div className="chatbot-error-bar" role="alert">
              {error}
            </div>
          )}

          <div className="chatbot-input-wrap">
            <textarea
              className="chatbot-input"
              placeholder="Type your message..."
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={1}
              disabled={loading}
              maxLength={2000}
            />
            <button
              type="button"
              className="chatbot-send-btn"
              onClick={sendMessage}
              disabled={!messageInput.trim() || loading}
              aria-label="Send message"
            >
              <IoSend />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
