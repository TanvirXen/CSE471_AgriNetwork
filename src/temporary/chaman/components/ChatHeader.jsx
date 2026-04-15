// ChatHeader.jsx — AgriNetwork Bangladesh
// Top bar with user info and working action buttons

import { useState, useEffect, useRef } from "react";

// ── Simple Toast Notification ────────────────────────────────────
function Toast({ message, type = "info", onClose }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div style={{
      position: "fixed", bottom: 80, left: "50%", transform: "translateX(-50%)",
      background: type === "danger" ? "#ef4444" : "#1a1a2e",
      color: "#fff", padding: "12px 24px", borderRadius: "12px",
      fontSize: "0.9rem", zIndex: 1000, boxShadow: "0 8px 32px rgba(0,0,0,0.2)",
      animation: "fadeInUp 0.3s ease-out forwards",
    }}>
      {message}
    </div>
  );
}

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
  const [status, setStatus] = useState("calling");
  const [timer, setTimer] = useState(0);
  const timerRef = useRef(null);

  useEffect(() => {
    if (status === "connected") {
      timerRef.current = setInterval(() => {
        setTimer(v => v + 1);
      }, 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [status]);

  const formatTime = (s) => {
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleAnswer = () => setStatus("connected");
  const handleEnd = () => { 
    setStatus("ended"); 
    setTimeout(onClose, 1500); 
  };

  const handleNativeDial = () => {
    window.location.href = `tel:${conversation?.phone || "01700000000"}`;
    onClose();
  };

  return (
    <div className="cn-modal-overlay">
      <div className="cn-modal" style={{ maxWidth: 320, textAlign: "center", overflow: "hidden" }}>
        {/* Call Animation / Pulse Ring */}
        <div style={{ padding: "40px 24px" }}>
          <div className={`cn-call-avatar ${status === "calling" ? "is-ringing" : ""}`} style={{
            width: 90, height: 90, borderRadius: "50%",
            background: "var(--cn-green)", color: "#fff",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "2.2rem", fontWeight: 700, margin: "0 auto 20px",
            position: "relative", zIndex: 2
          }}>
            {conversation?.avatar || conversation?.name?.slice(0, 2).toUpperCase()}
          </div>
          
          <div style={{ fontWeight: 700, fontSize: "1.2rem", color: "#1a1a2e", marginBottom: 8 }}>
            {conversation?.name}
          </div>
          
          <div style={{ color: status === "connected" ? "#10b981" : "#888", fontWeight: 600, fontSize: "1rem", marginBottom: 40 }}>
            {status === "calling" && "Ringing…"}
            {status === "connected" && (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                    <span style={{ display: "inline-block", width: 8, height: 8, borderRadius: "50%", background: "#10b981" }} />
                    {formatTime(timer)}
                </div>
            )}
            {status === "ended" && "Call Ended"}
          </div>

          <div style={{ display: "flex", gap: 20, justifyContent: "center" }}>
            {status === "calling" && (
              <button 
                className="cn-call-btn cn-answer"
                onClick={handleAnswer} 
                style={{ background: "#10b981", color: "#fff", border: "none", borderRadius: "50%", width: 60, height: 60, fontSize: "1.6rem", cursor: "pointer", boxShadow: "0 4px 12px rgba(16,185,129,0.3)" }}
              >📞</button>
            )}
            <button 
              className="cn-call-btn cn-decline"
              onClick={handleEnd} 
              style={{ background: "#ef4444", color: "#fff", border: "none", borderRadius: "50%", width: 60, height: 60, fontSize: "1.6rem", cursor: "pointer", boxShadow: "0 4px 12px rgba(239,68,68,0.3)" }}
            >☎️</button>
          </div>

          <div style={{ marginTop: 32 }}>
            <button 
              onClick={handleNativeDial}
              style={{ background: "none", border: "none", color: "var(--cn-green)", fontWeight: 600, fontSize: "0.85rem", cursor: "pointer", textDecoration: "underline" }}
            >
              📞 Switch to Carrier Call
            </button>
          </div>
        </div>
      </div>
      <style>{`
        .cn-call-avatar.is-ringing::after {
          content: "";
          position: absolute;
          inset: -15px;
          border-radius: 50%;
          background: var(--cn-green);
          opacity: 0.2;
          animation: pulse-ring 1.5s infinite;
          z-index: -1;
        }
        @keyframes pulse-ring {
          0% { transform: scale(0.8); opacity: 0.4; }
          100% { transform: scale(1.6); opacity: 0; }
        }
        .cn-call-btn:active { transform: scale(0.9); }
      `}</style>
    </div>
  );
}

// ── More Options Dropdown ─────────────────────────────────────────
function MoreMenu({ onClose, onAction, isMuted }) {
  const options = [
    { id: "mute", icon: isMuted ? "🔊" : "🔔", label: isMuted ? "Unmute Chat" : "Mute Notifications" },
    { id: "share", icon: "📤", label: "Share Contact" },
    { id: "block", icon: "🚫", label: "Block User" },
    { id: "report", icon: "⚠️", label: "Report" },
  ];
  return (
    <div style={{
      position: "absolute", top: "100%", right: 0, zIndex: 200,
      background: "#fff", borderRadius: 12, boxShadow: "0 8px 24px rgba(0,0,0,0.15)",
      minWidth: 200, overflow: "hidden", marginTop: 8,
      animation: "scaleIn 0.2s ease-out forwards",
    }}>
      {options.map((opt) => (
        <button key={opt.id}
          onClick={() => { onAction(opt.id); onClose(); }}
          style={{
            display: "flex", alignItems: "center", gap: 12,
            padding: "14px 16px", width: "100%",
            background: "none", border: "none", cursor: "pointer",
            fontSize: "0.85rem", fontWeight: 500,
            color: opt.id === "block" || opt.id === "report" ? "#ef4444" : "#1a1a2e",
            borderBottom: "1px solid #f0f0f0",
            textAlign: "left", transition: "background 0.2s"
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = "#f7f9f7"}
          onMouseLeave={(e) => e.currentTarget.style.background = "none"}
        >
          <span style={{ fontSize: "1.1rem" }}>{opt.icon}</span> {opt.label}
        </button>
      ))}
      <style>{`
        @keyframes scaleIn {
            from { opacity: 0; transform: scale(0.95) translateY(-10px); }
            to { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>
    </div>
  );
}

// ── MAIN ChatHeader ───────────────────────────────────────────────
function ChatHeader({ conversation, onToggleSidebar }) {
  const [showProfile, setShowProfile] = useState(false);
  const [showCall, setShowCall] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [toast, setToast] = useState(null);

  if (!conversation) return null;

  const handleMenuAction = (id) => {
    switch (id) {
        case "mute":
            setIsMuted(!isMuted);
            setToast({ message: !isMuted ? "Chat muted" : "Chat unmuted" });
            break;
        case "share":
            if (navigator.share) {
                navigator.share({ title: `AgriNetwork: ${conversation.name}`, url: window.location.href });
            } else {
                navigator.clipboard.writeText(`${conversation.name} - ${window.location.href}`);
                setToast({ message: "Contact link copied to clipboard!" });
            }
            break;
        case "block":
            if (window.confirm(`Are you sure you want to block ${conversation.name}?`)) {
                setToast({ message: `${conversation.name} has been blocked.`, type: "danger" });
            }
            break;
        case "report":
            if (window.confirm(`Report ${conversation.name} for suspicious activity?`)) {
                setToast({ message: "Repoted. Our team will investigate. Thank you.", type: "danger" });
            }
            break;
        case "offers":
            setToast({ message: "Opening negotiation summary..." });
            break;
        default:
            break;
    }
  };

  return (
    <>
      <header className="cn-chat-header">
        <button className="cn-icon-btn cn-mob-toggle" onClick={onToggleSidebar} aria-label="Toggle sidebar">
          ☰
        </button>
        <div className="cn-chat-header__avatar" title="View profile"
          onClick={() => setShowProfile(true)} style={{ cursor: "pointer" }}>
          {conversation.avatar || conversation.name?.slice(0, 2).toUpperCase()}
        </div>
        <div className="cn-chat-header__info">
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div className="cn-chat-header__name">{conversation.name}</div>
            {isMuted && <span style={{ fontSize: "0.8rem", opacity: 0.6 }}>🔇</span>}
          </div>
          <div className="cn-chat-header__meta">
            {conversation.online ? (
              <><span className="cn-chat-header__status-dot" />Online · Active now</>
            ) : "Offline"}
          </div>
        </div>
        {conversation.crop && (
          <div className="cn-chat-header__crop-tag">🌾 {conversation.crop}</div>
        )}
        <div className="cn-chat-header__actions" style={{ position: "relative" }}>
          <button className="cn-icon-btn" title="View profile" onClick={() => setShowProfile(true)}>👤</button>
          <button className="cn-icon-btn" title="Voice call" onClick={() => setShowCall(true)}>📞</button>
          <button className="cn-icon-btn" title="More options" onClick={() => setShowMenu((v) => !v)}>⋯</button>
          {showMenu && <MoreMenu onClose={() => setShowMenu(false)} onAction={handleMenuAction} isMuted={isMuted} />}
        </div>
      </header>

      {showProfile && <ProfileDrawer conversation={conversation} onClose={() => setShowProfile(false)} />}
      {showCall && <CallModal conversation={conversation} onClose={() => setShowCall(false)} />}
      
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      
      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translate(-50%, 20px); }
          to { opacity: 1; transform: translate(-50%, 0); }
        }
      `}</style>
    </>
  );
}

export default ChatHeader;
