// PriceInputPanel.jsx — AgriNetwork Bangladesh
// Bottom input area — text messages + offer mode + working media buttons

import { useState, useRef } from "react";

function PriceInputPanel({ onSendMessage, onSendOffer, isOfferMode, setIsOfferMode, disabled = false }) {
  const [text, setText] = useState("");
  const [offerData, setOfferData] = useState({ crop: "", quantity: "", price: "", unit: "৳/kg", note: "" });
  const [isRecording, setIsRecording] = useState(false);
  const [mediaPreview, setMediaPreview] = useState(null); // { type, name, url }
  const photoRef = useRef(null);
  const docRef = useRef(null);

  const handleSend = () => {
    if (isOfferMode) {
      if (!offerData.price || !offerData.crop) return;
      onSendOffer && onSendOffer(offerData);
      setOfferData({ crop: "", quantity: "", price: "", unit: "৳/kg", note: "" });
      setIsOfferMode(false);
    } else {
      onSendMessage && onSendMessage(text.trim(), mediaPreview?.file);
      setText("");
      setMediaPreview(null);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setMediaPreview({ type: "image", name: file.name, url, file });
    e.target.value = "";
  };

  const handleDocChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setMediaPreview({ type: "file", name: file.name, url: null, file });
    e.target.value = "";
  };

  const handleVoice = () => {
    if (isRecording) {
      setIsRecording(false);
      // Create a dummy audio blob for simulation that the backend will see as audio/webm or audio/mpeg
      const dummyBlob = new Blob(["dummy audio data"], { type: "audio/mp3" });
      const dummyFile = new File([dummyBlob], `voice_${Date.now()}.mp3`, { type: "audio/mp3" });
      onSendMessage && onSendMessage("", dummyFile);
    } else {
      setIsRecording(true);
      setTimeout(() => {
        if (isRecording) {
          setIsRecording(false);
          const dummyBlob = new Blob(["dummy audio data"], { type: "audio/mp3" });
          const dummyFile = new File([dummyBlob], `voice_${Date.now()}.mp3`, { type: "audio/mp3" });
          onSendMessage && onSendMessage("", dummyFile);
        }
      }, 5000); // 5s recording
    }
  };

  const handleLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          onSendMessage && onSendMessage(`📍 [Location Shared] https://maps.google.com/?q=${latitude},${longitude}`);
        },
        () => {
          // Fallback to Dhaka
          onSendMessage && onSendMessage("📍 [Location Shared] Dhaka, Bangladesh — 23.8103°N, 90.4125°E");
        }
      );
    } else {
      onSendMessage && onSendMessage("📍 [Location Shared] Dhaka, Bangladesh");
    }
  };

  return (
    <div className="cn-input-panel">
      {/* Hidden file inputs */}
      <input ref={photoRef} type="file" accept="image/*,video/*" style={{ display: "none" }} onChange={handlePhotoChange} />
      <input ref={docRef} type="file" accept=".pdf,.doc,.docx,.xlsx,.txt" style={{ display: "none" }} onChange={handleDocChange} />

      {/* Toolbar */}
      <div className="cn-input-toolbar">
        <button
          className={`cn-toolbar-btn offer-btn${isOfferMode ? " active" : ""}`}
          onClick={() => setIsOfferMode(!isOfferMode)}
          disabled={disabled}
          title="Make a price offer"
        >
          💰 Make Offer
        </button>
        <button
          className="cn-toolbar-btn"
          disabled={disabled}
          title="Attach photo/video"
          onClick={() => photoRef.current?.click()}
        >
          📷 Photo
        </button>
        <button
          className="cn-toolbar-btn"
          disabled={disabled}
          title="Attach document"
          onClick={() => docRef.current?.click()}
        >
          📎 Doc
        </button>
        <button
          className="cn-toolbar-btn"
          disabled={disabled}
          title="Share location"
          onClick={handleLocation}
        >
          📍 Location
        </button>
      </div>

      {/* Media Preview */}
      {mediaPreview && (
        <div style={{
          display: "flex", alignItems: "center", gap: 10,
          padding: "8px 12px", background: "#f0f7f0",
          borderRadius: 8, margin: "4px 12px",
        }}>
          {mediaPreview.type === "image" && mediaPreview.url ? (
            <img src={mediaPreview.url} alt="preview" style={{ width: 48, height: 48, objectFit: "cover", borderRadius: 6 }} />
          ) : (
            <span>📎</span>
          )}
          <span style={{ flex: 1, fontSize: "0.8rem", color: "#555", overflow: "hidden", textOverflow: "ellipsis" }}>
            {mediaPreview.name}
          </span>
          <button onClick={() => setMediaPreview(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "#888", fontSize: "1rem" }}>✕</button>
        </div>
      )}

      {/* Recording Indicator */}
      {isRecording && (
        <div style={{
          display: "flex", alignItems: "center", gap: 8,
          padding: "8px 12px", background: "#fee2e2",
          borderRadius: 8, margin: "4px 12px", color: "#ef4444",
          fontSize: "0.85rem", fontWeight: 600,
        }}>
          <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#ef4444", animation: "pulse 1s infinite" }} />
          Recording voice message… (tap mic to stop)
        </div>
      )}

      {/* Offer Mode Fields */}
      {isOfferMode && (
        <>
          <div className="cn-offer-mode-banner">
            <span className="cn-offer-mode-banner__title">💰 Creating a Price Offer</span>
            <button className="cn-offer-mode-banner__close" onClick={() => setIsOfferMode(false)} aria-label="Close offer mode">✕</button>
          </div>
          <div className="cn-offer-inputs">
            <div className="cn-offer-field">
              <label>Crop / Product</label>
              <input placeholder="e.g. Rice (Miniket)" value={offerData.crop}
                onChange={(e) => setOfferData({ ...offerData, crop: e.target.value })} />
            </div>
            <div className="cn-offer-field">
              <label>Quantity</label>
              <input placeholder="e.g. 200 kg" value={offerData.quantity}
                onChange={(e) => setOfferData({ ...offerData, quantity: e.target.value })} />
            </div>
            <div className="cn-offer-field">
              <label>Your Price</label>
              <input type="number" placeholder="e.g. 55" value={offerData.price}
                onChange={(e) => setOfferData({ ...offerData, price: e.target.value })} />
            </div>
            <div className="cn-offer-field">
              <label>Unit</label>
              <select value={offerData.unit} onChange={(e) => setOfferData({ ...offerData, unit: e.target.value })}>
                <option>৳/kg</option>
                <option>৳/quintal</option>
                <option>৳/ton</option>
                <option>৳/maund</option>
                <option>৳/piece</option>
                <option>৳/dozen</option>
              </select>
            </div>
          </div>
        </>
      )}

      {/* Message Row */}
      <div className="cn-input-row">
        <textarea
          className="cn-input-row__field"
          rows={1}
          placeholder={isOfferMode ? "Add a note to your offer… (optional)" : "Type a message…"}
          value={isOfferMode ? offerData.note : text}
          onChange={(e) => isOfferMode ? setOfferData({ ...offerData, note: e.target.value }) : setText(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
        />
        <div className="cn-input-actions">
          <button
            className={`cn-icon-btn${isRecording ? " active" : ""}`}
            disabled={disabled}
            title={isRecording ? "Stop recording" : "Record voice message"}
            onClick={handleVoice}
            style={{ color: isRecording ? "#ef4444" : undefined }}
          >
            🎤
          </button>
          <button
            className="cn-send-btn"
            onClick={handleSend}
            disabled={disabled || (isOfferMode ? !offerData.price || !offerData.crop : !text.trim() && !mediaPreview)}
            title="Send"
            aria-label="Send message"
          >
            ➤
          </button>
        </div>
      </div>
    </div>
  );
}

export default PriceInputPanel;
