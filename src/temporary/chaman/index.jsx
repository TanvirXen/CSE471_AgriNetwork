// ChatNegotiationPage (index.jsx) — AgriNetwork Bangladesh
// Full Chat + Live Price Negotiation page (UI only)

import { useState, useRef, useEffect } from "react";
import "./ChatNegotiation.css";

import LivePriceTicker from "./components/LivePriceTicker";
import ChatSidebar, { CONVERSATIONS } from "./components/ChatSidebar";
import ChatHeader from "./components/ChatHeader";
import MessageBubble from "./components/MessageBubble";
import PriceInputPanel from "./components/PriceInputPanel";

/* ─────────────────────────────────────────────
   Static seeded messages per conversation
───────────────────────────────────────────── */
const SEED_MESSAGES = {
  1: [
    { id: 1, type: "date", text: "Today" },
    {
      id: 2,
      type: "text",
      isSent: false,
      senderInitials: "RU",
      text: "আস্সালামু আলায়কুম ভাই। আমার কাছে প্রিমিয়াম মিনিকেট চাল আছে — নতুন ফসল। আগ্রহী আছেন?",
      timestamp: "9:32 AM",
    },
    {
      id: 3,
      type: "text",
      isSent: true,
      senderInitials: "You",
      text: "Wa alaikum salam! Yes, interested. What quantity do you have available?",
      timestamp: "9:34 AM",
    },
    {
      id: 4,
      type: "text",
      isSent: false,
      senderInitials: "RU",
      text: "I have about 500 kg ready. Everything sun-dried and bagged properly.",
      timestamp: "9:35 AM",
    },
    {
      id: 5,
      type: "negotiation",
      isSent: false,
      senderInitials: "RU",
      negType: "offer",
      crop: "Premium Rice (Miniket) — New Harvest",
      quantity: "500 kg",
      offerPrice: 60,
      marketPrice: 58,
      unit: "৳/kg",
      timestamp: "9:37 AM",
    },
    {
      id: 6,
      type: "text",
      isSent: true,
      senderInitials: "You",
      text: "That's a bit above market rate. Let me send a counter offer.",
      timestamp: "9:39 AM",
    },
    {
      id: 7,
      type: "negotiation",
      isSent: true,
      senderInitials: "You",
      negType: "counter",
      crop: "Premium Rice (Miniket) — New Harvest",
      quantity: "500 kg",
      offerPrice: 55,
      marketPrice: 58,
      unit: "৳/kg",
      timestamp: "9:40 AM",
    },
    {
      id: 8,
      type: "text",
      isSent: false,
      senderInitials: "RU",
      text: "৳55/kg is my final offer for the rice. Can you do ৳57?",
      timestamp: "9:42 AM",
    },
  ],
  2: [
    { id: 1, type: "date", text: "Yesterday" },
    {
      id: 2,
      type: "text",
      isSent: false,
      senderInitials: "DF",
      text: "Hello! We are looking for 1 tonne of potato this week for our Dhaka outlets.",
      timestamp: "11:00 AM",
    },
    {
      id: 3,
      type: "negotiation",
      isSent: false,
      senderInitials: "DF",
      negType: "offer",
      crop: "Potato (Diamond)",
      quantity: "1000 kg",
      offerPrice: 20,
      marketPrice: 22,
      unit: "৳/kg",
      timestamp: "11:02 AM",
    },
    {
      id: 4,
      type: "negotiation",
      isSent: true,
      senderInitials: "You",
      negType: "accepted",
      crop: "Potato (Diamond)",
      quantity: "1000 kg",
      offerPrice: 20,
      marketPrice: 22,
      unit: "৳/kg",
      timestamp: "11:10 AM",
    },
    {
      id: 5,
      type: "status",
      text: "🎉 Deal confirmed! Both parties agreed on ৳20/kg for 1000 kg of Potato.",
      dealClosed: true,
    },
    { id: 6, type: "date", text: "Today" },
    {
      id: 7,
      type: "text",
      isSent: false,
      senderInitials: "DF",
      text: "We can pick up from Manikganj on Friday. Please confirm loading time.",
      timestamp: "10:18 AM",
    },
  ],
  3: [
    { id: 1, type: "date", text: "2 days ago" },
    {
      id: 2,
      type: "text",
      isSent: true,
      senderInitials: "You",
      text: "Hello! We'd like to purchase onions in bulk. What's your best price?",
      timestamp: "2:00 PM",
    },
    {
      id: 3,
      type: "negotiation",
      isSent: true,
      senderInitials: "You",
      negType: "offer",
      crop: "Red Onion",
      quantity: "300 kg",
      offerPrice: 68,
      marketPrice: 75,
      unit: "৳/kg",
      timestamp: "2:05 PM",
    },
    {
      id: 4,
      type: "negotiation",
      isSent: false,
      senderInitials: "KA",
      negType: "counter",
      crop: "Red Onion",
      quantity: "300 kg",
      offerPrice: 72,
      marketPrice: 75,
      unit: "৳/kg",
      timestamp: "2:15 PM",
    },
    {
      id: 5,
      type: "negotiation",
      isSent: true,
      senderInitials: "You",
      negType: "accepted",
      crop: "Red Onion",
      quantity: "300 kg",
      offerPrice: 72,
      marketPrice: 75,
      unit: "৳/kg",
      timestamp: "2:20 PM",
    },
    {
      id: 6,
      type: "status",
      text: "Counter offer accepted ✔  Deal closed at ৳72/kg",
      dealClosed: true,
    },
  ],
};

/* ─────────────────────────────────────────────
   Quick Offer Modal
───────────────────────────────────────────── */
function QuickOfferModal({ onClose, onSubmit, counterFor }) {
  const [data, setData] = useState({
    crop: counterFor?.crop || "",
    quantity: counterFor?.quantity || "",
    price: "",
    unit: counterFor?.unit || "৳/kg",
    note: "",
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!data.crop || !data.price) return;
    onSubmit(data);
    onClose();
  };

  return (
    <div className="cn-modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="cn-modal" role="dialog" aria-modal="true" aria-labelledby="modal-title">
        <div className="cn-modal__header">
          <div>
            <div className="cn-modal__title" id="modal-title">
              {counterFor ? "🔄 Send Counter Offer" : "💰 Send Price Offer"}
            </div>
            <div className="cn-modal__subtitle">
              {counterFor ? `Responding to offer on ${counterFor.crop}` : "Propose a price to the seller"}
            </div>
          </div>
          <button className="cn-modal__close" onClick={onClose} aria-label="Close modal">✕</button>
        </div>

        <form onSubmit={handleSubmit}>
          {counterFor && (
            <div className="cn-modal__market-note">
              Original offer: <strong>{counterFor.offerPrice} {counterFor.unit}</strong> for{" "}
              <strong>{counterFor.quantity}</strong> of <strong>{counterFor.crop}</strong>
            </div>
          )}

          <div className="cn-modal__field">
            <label>Crop / Product *</label>
            <input
              placeholder="e.g. Premium Rice (Miniket)"
              value={data.crop}
              onChange={(e) => setData({ ...data, crop: e.target.value })}
              required
            />
          </div>

          <div className="cn-modal__grid-2">
            <div className="cn-modal__field">
              <label>Quantity</label>
              <input
                placeholder="e.g. 200 kg"
                value={data.quantity}
                onChange={(e) => setData({ ...data, quantity: e.target.value })}
              />
            </div>
            <div className="cn-modal__field">
              <label>Unit</label>
              <select
                value={data.unit}
                onChange={(e) => setData({ ...data, unit: e.target.value })}
              >
                <option>৳/kg</option>
                <option>৳/quintal</option>
                <option>৳/ton</option>
                <option>৳/piece</option>
                <option>৳/dozen</option>
              </select>
            </div>
          </div>

          <div className="cn-modal__field">
            <label>Your Price ({data.unit}) *</label>
            <input
              type="number"
              placeholder="Enter amount"
              value={data.price}
              onChange={(e) => setData({ ...data, price: e.target.value })}
              required
              min="1"
            />
          </div>

          <div className="cn-modal__field">
            <label>Note (optional)</label>
            <textarea
              placeholder="Any additional terms, delivery info, or remarks…"
              value={data.note}
              onChange={(e) => setData({ ...data, note: e.target.value })}
            />
          </div>

          <div className="cn-modal__actions">
            <button type="button" className="cn-btn cn-btn--ghost" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="cn-btn cn-btn--primary">
              {counterFor ? "Send Counter Offer" : "Send Offer"} →
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   MAIN PAGE
───────────────────────────────────────────── */
function ChatNegotiationPage() {
  const [activeConv, setActiveConv] = useState(CONVERSATIONS[0]);
  const [messages, setMessages] = useState(SEED_MESSAGES[1] || []);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isOfferMode, setIsOfferMode] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [counterFor, setCounterFor] = useState(null);
  const messagesEndRef = useRef(null);

  // Scroll to bottom whenever messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Simulate "typing…" indicator after user sends
  const simulateTyping = () => {
    setIsTyping(true);
    setTimeout(() => setIsTyping(false), 2200);
  };

  const handleSelectConv = (conv) => {
    setActiveConv(conv);
    setMessages(SEED_MESSAGES[conv.id] || [
      { id: 1, type: "date", text: "Today" },
      {
        id: 2,
        type: "text",
        isSent: false,
        senderInitials: conv.avatar,
        text: "Hello! I'm interested in discussing a trade.",
        timestamp: "Just now",
      },
    ]);
    setIsOfferMode(false);
    setSidebarOpen(false);
  };

  const handleSendMessage = (text) => {
    const msg = {
      id: Date.now(),
      type: "text",
      isSent: true,
      senderInitials: "You",
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };
    setMessages((prev) => [...prev, msg]);
    simulateTyping();
  };

  const handleSendOffer = (offerData) => {
    const msg = {
      id: Date.now(),
      type: "negotiation",
      isSent: true,
      senderInitials: "You",
      negType: "offer",
      crop: offerData.crop,
      quantity: offerData.quantity || "—",
      offerPrice: Number(offerData.price),
      marketPrice: 58, // placeholder market rate
      unit: offerData.unit,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };
    setMessages((prev) => [...prev, msg]);
    setIsOfferMode(false);
    simulateTyping();
  };

  const handleAcceptOffer = (msgId) => {
    setMessages((prev) =>
      prev.map((m) => {
        if (m.id === msgId && m.type === "negotiation") {
          return { ...m, negType: "accepted" };
        }
        return m;
      })
    );
    // Insert status message
    const statusMsg = {
      id: Date.now(),
      type: "status",
      text: "🎉 Deal confirmed! Both parties agreed on this price.",
      dealClosed: true,
    };
    setMessages((prev) => [...prev, statusMsg]);
  };

  const handleRejectOffer = (msgId) => {
    setMessages((prev) =>
      prev.map((m) => {
        if (m.id === msgId && m.type === "negotiation") {
          return { ...m, negType: "rejected" };
        }
        return m;
      })
    );
    const statusMsg = {
      id: Date.now(),
      type: "status",
      text: "Offer was declined. You can send a counter offer or start fresh.",
    };
    setMessages((prev) => [...prev, statusMsg]);
  };

  const handleCounterOffer = (msgId) => {
    const originalMsg = messages.find((m) => m.id === msgId);
    setCounterFor(originalMsg);
    setModalOpen(true);
  };

  const handleModalSubmit = (data) => {
    const msg = {
      id: Date.now(),
      type: "negotiation",
      isSent: true,
      senderInitials: "You",
      negType: "counter",
      crop: data.crop,
      quantity: data.quantity || counterFor?.quantity || "—",
      offerPrice: Number(data.price),
      marketPrice: counterFor?.offerPrice || 58,
      unit: data.unit,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };
    setMessages((prev) => [...prev, msg]);
    setCounterFor(null);
    simulateTyping();
  };

  return (
    <div className="cn-page">
      {/* Live Market Price Ticker */}
      <LivePriceTicker />

      {/* Page Title Bar */}
      <div className="cn-page-header">
        <div className="cn-page-header__title">
          <h1>💬 Chat & Price Negotiation</h1>
          <span>AgriNetwork Bangladesh — Direct Farmer-Vendor Deals</span>
        </div>
        <div className="cn-page-header__badges">
          <span className="cn-badge cn-badge--active">
            🟢 3 Active Chats
          </span>
          <span className="cn-badge cn-badge--deals">
            🤝 2 Deals Pending
          </span>
        </div>
      </div>

      {/* Main layout: Sidebar + Chat */}
      <div className="cn-layout">
        {/* Sidebar overlay backdrop on mobile */}
        {sidebarOpen && (
          <div
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(52,78,65,0.3)",
              zIndex: 40,
            }}
            onClick={() => setSidebarOpen(false)}
            aria-hidden="true"
          />
        )}

        <ChatSidebar
          activeId={activeConv?.id}
          onSelect={handleSelectConv}
          isOpen={sidebarOpen}
        />

        {/* Chat Area */}
        <div className="cn-chat">
          {activeConv ? (
            <>
              <ChatHeader
                conversation={activeConv}
                activeStep={2}
                onToggleSidebar={() => setSidebarOpen((v) => !v)}
              />

              {/* Messages */}
              <div className="cn-messages" role="log" aria-live="polite">
                {messages.map((msg) => (
                  <MessageBubble
                    key={msg.id}
                    message={msg}
                    onAcceptOffer={handleAcceptOffer}
                    onRejectOffer={handleRejectOffer}
                    onCounterOffer={handleCounterOffer}
                  />
                ))}

                {/* Typing Indicator */}
                {isTyping && (
                  <div className="cn-msg-row received">
                    <div className="cn-msg-avatar">{activeConv.avatar}</div>
                    <div className="cn-typing">
                      <div className="cn-typing-dots">
                        <span /><span /><span />
                      </div>
                      {activeConv.name} is typing…
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Input Panel */}
              <PriceInputPanel
                onSendMessage={handleSendMessage}
                onSendOffer={handleSendOffer}
                isOfferMode={isOfferMode}
                setIsOfferMode={setIsOfferMode}
              />
            </>
          ) : (
            /* Empty state */
            <div className="cn-empty-chat">
              <div className="cn-empty-chat__icon">💬</div>
              <div className="cn-empty-chat__title">Select a conversation</div>
              <div className="cn-empty-chat__sub">
                Choose a farmer or vendor from the list on the left to start chatting and negotiating prices.
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Quick Offer / Counter Offer Modal */}
      {modalOpen && (
        <QuickOfferModal
          counterFor={counterFor}
          onClose={() => { setModalOpen(false); setCounterFor(null); }}
          onSubmit={handleModalSubmit}
        />
      )}
    </div>
  );
}

export default ChatNegotiationPage;
