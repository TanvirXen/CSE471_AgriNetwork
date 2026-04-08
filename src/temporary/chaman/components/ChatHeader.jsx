// ChatHeader.jsx — AgriNetwork Bangladesh
// Top bar with user info, deal progress, and working action buttons

import { useState } from "react";

const DEAL_STEPS = [
  { label: "Inquiry" },
  { label: "Offer" },
  { label: "Negotiating" },
  { label: "Agreed" },
  { label: "Confirmed" },
];

// ── Profile Drawer ────────────────────────────────────────────────
function ProfileDrawer({ conversation, onClose }) {
  if (!conversation) return null;
  return (
    <div className="cn-modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="cn-modal" style={{ maxWidth: 420 }}>
        <div className="cn-modal__header">
          <div className="cn-modal__title">👤 Seller Profile</div>
          <button className="cn-modal__close" onClick={onClose}>✕</button>
        </div>
        <div className="cn-modal__body" style={{ padding: "24px" }}>
          <div style={{ display: "flex", gap: 16, alignItems: "center", marginBottom: 20 }}>
            <div style={{
              width: 64, height: 64, borderRadius: 16,
              background: "var(--cn-green)", color: "#fff",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "1.5rem", fontWeight: 700,
            }}>
              {conversation.avatar || conversation.name?.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: "1.1rem", color: "var(--cn-dark)" }}>
                {conversation.name}
              </div>
              <div style={{ fontSize: "0.8rem", color: "#888", marginTop: 4 }}>
                {conversation.role === "farmer" ? "🌾 Farmer" : "🏪 Vendor"} ·{" "}
                <span style={{ color: "#10b981" }}>● Active now</span>
              </div>
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div style={{ background: "#f9f9f9", padding: 12, borderRadius: 10 }}>
              <div style={{ fontSize: "0.7rem", color: "#999", marginBottom: 4 }}>Main Crop</div>
              <div style={{ fontWeight: 600, color: "var(--cn-dark)" }}>
                {conversation.crop || "Various"}
              </div>
            </div>
            <div style={{ background: "#f9f9f9", padding: 12, borderRadius: 10 }}>
              <div style={{ fontSize: "0.7rem", color: "#999", marginBottom: 4 }}>Location</div>
              <div style={{ fontWeight: 600, color: "var(--cn-dark)" }}>
                {conversation.district || "Bangladesh"}
              </div>
            </div>
            <div style={{ background: "#f9f9f9", padding: 12, borderRadius: 10 }}>
              <div style={{ fontSize: "0.7rem", color: "#999", marginBottom: 4 }}>Rating</div>
              <div style={{ fontWeight: 600, color: "var(--cn-dark)" }}>
                ⭐ {conversation.rating || "4.5"} / 5.0
              </div>
            </div>
            <div style={{ background: "#f9f9f9", padding: 12, borderRadius: 10 }}>
              <div style={{ fontSize: "0.7rem", color: "#999", marginBottom: 4 }}>Status</div>
              <div style={{ fontWeight: 600, color: "#10b981" }}>✔ Verified</div>
            </div>
          </div>
          {conversation.description && (
            <p style={{ marginTop: 16, fontSize: "0.85rem", color: "#666", lineHeight: 1.6 }}>
              {conversation.description}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Call Modal ────────────────────────────────────────────────────
function CallModal({ conversation, onClose }) {
  const [status, setStatus] = useState("calling"); // calling | connected | ended

  const handleAnswer = () => setStatus("connected");
  const handleEnd = () => { setStatus("ended"); setTimeout(onClose, 1000); };

  return (
    <div className="cn-modal-overlay">
      <div className="cn-modal" style={{ maxWidth: 320, textAlign: "center" }}>
        <div style={{ padding: "32px 24px" }}>
          <div style={{
            width: 80, height: 80, borderRadius: "50%",
            background: "var(--cn-green)", color: "#fff",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "2rem", fontWeight: 700, margin: "0 auto 16px",
            boxShadow: status === "calling" ? "0 0 0 10px rgba(74,128,78,0.2)" : "none",
            animation: status === "calling" ? "pulse 1.5s infinite" : "none",
          }}>
            {conversation?.avatar || "??"}
          </div>
          <div style={{ fontWeight: 700, fontSize: "1.1rem", marginBottom: 4 }}>
            {conversation?.name}
          </div>
          <div style={{ color: "#888", fontSize: "0.85rem", marginBottom: 32 }}>
            {status === "calling" && "Calling…"}
            {status === "connected" && "🟢 Connected"}
            {status === "ended" && "Call ended"}
          </div>
          <div style={{ display: "flex", gap: 16, justifyContent: "center" }}>
            {status === "calling" && (
              <button
                onClick={handleAnswer}
                style={{
                  background: "#10b981", color: "#fff", border: "none",
                  borderRadius: "50%", width: 56, height: 56, fontSize: "1.4rem", cursor: "pointer",
                }}
              >📞</button>
            )}
            <button
              onClick={handleEnd}
              style={{
                background: "#ef4444", color: "#fff", border: "none",
                borderRadius: "50%", width: 56, height: 56, fontSize: "1.4rem", cursor: "pointer",
              }}
            >☎️</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── More Options Dropdown ─────────────────────────────────────────
function MoreMenu({ onClose }) {
  const options = [
    { icon: "📋", label: "View All Offers" },
    { icon: "🔔", label: "Mute Notifications" },
    { icon: "📤", label: "Share Contact" },
    { icon: "🚫", label: "Block User" },
    { icon: "⚠️", label: "Report" },
  ];
  return (
    <div style={{
      position: "absolute", top: "100%", right: 0, zIndex: 200,
      background: "#fff", borderRadius: 12, boxShadow: "0 8px 24px rgba(0,0,0,0.15)",
      minWidth: 200, overflow: "hidden",
    }}>
      {options.map((opt) => (
        <button
          key={opt.label}
          onClick={() => { alert(`${opt.label} — coming soon!`); onClose(); }}
          style={{
            display: "flex", alignItems: "center", gap: 12,
            padding: "12px 16px", width: "100%",
            background: "none", border: "none", cursor: "pointer",
            fontSize: "0.85rem", color: opt.label === "Block User" || opt.label === "Report" ? "#ef4444" : "#333",
            borderBottom: "1px solid #f0f0f0",
          }}
        >
          <span>{opt.icon}</span> {opt.label}
        </button>
      ))}
    </div>
  );
}

// ── MAIN ChatHeader ───────────────────────────────────────────────
function ChatHeader({ conversation, activeStep = 2, onToggleSidebar }) {
  const [showProfile, setShowProfile] = useState(false);
  const [showCall, setShowCall] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  if (!conversation) return null;

  return (
    <>
      {/* User Info Header */}
      <header className="cn-chat-header">
        <button className="cn-icon-btn cn-mob-toggle" onClick={onToggleSidebar} aria-label="Toggle sidebar">
          ☰
        </button>

        <div
          className="cn-chat-header__avatar"
          title="View profile"
          onClick={() => setShowProfile(true)}
          style={{ cursor: "pointer" }}
        >
          {conversation.avatar || conversation.name?.slice(0, 2).toUpperCase()}
        </div>

        <div className="cn-chat-header__info">
          <div className="cn-chat-header__name">{conversation.name}</div>
          <div className="cn-chat-header__meta">
            {conversation.online ? (
              <>
                <span className="cn-chat-header__status-dot" />
                Online · Active now
              </>
            ) : "Offline"}
          </div>
        </div>

        {conversation.crop && (
          <div className="cn-chat-header__crop-tag">
            🌾 {conversation.crop}
          </div>
        )}

        {/* Action Buttons */}
        <div className="cn-chat-header__actions" style={{ position: "relative" }}>
          <button
            className="cn-icon-btn"
            title="View profile"
            onClick={() => setShowProfile(true)}
          >👤</button>

          <button
            className="cn-icon-btn"
            title="Voice call"
            onClick={() => setShowCall(true)}
          >📞</button>

          <button
            className="cn-icon-btn"
            title="More options"
            onClick={() => setShowMenu((v) => !v)}
          >⋯</button>

          {showMenu && <MoreMenu onClose={() => setShowMenu(false)} />}
        </div>
      </header>

      {/* Deal Progress Banner */}
      <div className="cn-deal-banner">
        <span className="cn-deal-banner__label">DEAL PROGRESS</span>
        <div className="cn-deal-steps">
          {DEAL_STEPS.map((step, idx) => {
            const status = idx < activeStep ? "done" : idx === activeStep ? "active" : "";
            return (
              <div key={idx} className="cn-deal-step" style={{ display: "flex", alignItems: "center" }}>
                {idx > 0 && (
                  <div className={`cn-deal-step__line${idx <= activeStep ? " cn-deal-step__line--done" : ""}`} />
                )}
                <div className={`cn-deal-step ${status}`}>
                  <div className="cn-deal-step__circle">
                    {idx < activeStep ? "✓" : idx + 1}
                  </div>
                  <span className="cn-deal-step__label">{step.label}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Profile Drawer */}
      {showProfile && (
        <ProfileDrawer conversation={conversation} onClose={() => setShowProfile(false)} />
      )}

      {/* Call Modal */}
      {showCall && (
        <CallModal conversation={conversation} onClose={() => setShowCall(false)} />
      )}
    </>
  );
}

export default ChatHeader;
