// PriceInputPanel.jsx — AgriNetwork Bangladesh
// Bottom input area — text messages + offer mode + real MediaRecorder voice

import { useState, useRef, useEffect } from "react";

function PriceInputPanel({ onSendMessage, onSendOffer, isOfferMode, setIsOfferMode, disabled = false }) {
  const [text, setText] = useState("");
  const [offerData, setOfferData] = useState({ crop: "", quantity: "", price: "", unit: "৳/kg", note: "" });
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [mediaPreview, setMediaPreview] = useState(null);
  const photoRef = useRef(null);
  const docRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const timerRef = useRef(null);

  useEffect(() => {
    return () => {
      clearInterval(timerRef.current);
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
        mediaRecorderRef.current.stop();
      }
    };
  }, []);

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
    setMediaPreview({ type: "image", name: file.name, url: URL.createObjectURL(file), file });
    e.target.value = "";
  };

  const handleDocChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setMediaPreview({ type: "file", name: file.name, url: null, file });
    e.target.value = "";
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        stream.getTracks().forEach(t => t.stop());
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        const audioFile = new File([audioBlob], `voice_${Date.now()}.webm`, { type: "audio/webm" });
        onSendMessage && onSendMessage("🎤 Voice Message", audioFile);
        setRecordingTime(0);
        clearInterval(timerRef.current);
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      timerRef.current = setInterval(() => setRecordingTime(t => t + 1), 1000);
    } catch (err) {
      console.error("Microphone access denied:", err);
      alert("🎤 Microphone access denied. Please allow microphone permission in your browser settings.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
    clearInterval(timerRef.current);
  };

  const handleVoice = () => isRecording ? stopRecording() : startRecording();

  const formatTime = (s) =>
    `${Math.floor(s / 60).toString().padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;

  const handleLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => onSendMessage && onSendMessage(`📍 [Location Shared] https://maps.google.com/?q=${pos.coords.latitude},${pos.coords.longitude}`),
        () => onSendMessage && onSendMessage("📍 [Location Shared] Dhaka, Bangladesh — 23.8103°N, 90.4125°E")
      );
    } else {
      onSendMessage && onSendMessage("📍 [Location Shared] Dhaka, Bangladesh");
    }
  };

  return (
    <div className="cn-input-panel">
      <input ref={photoRef} type="file" accept="image/*,video/*" style={{ display: "none" }} onChange={handlePhotoChange} />
      <input ref={docRef} type="file" accept=".pdf,.doc,.docx,.xlsx,.txt" style={{ display: "none" }} onChange={handleDocChange} />

      {/* Toolbar */}
      <div className="cn-input-toolbar">
        <button className={`cn-toolbar-btn offer-btn${isOfferMode ? " active" : ""}`}
          onClick={() => setIsOfferMode(!isOfferMode)} disabled={disabled} title="Make a price offer">
          💰 Make Offer
        </button>
        <button className="cn-toolbar-btn" disabled={disabled} title="Attach photo/video"
          onClick={() => photoRef.current?.click()}>📷 Photo</button>
        <button className="cn-toolbar-btn" disabled={disabled} title="Attach document"
          onClick={() => docRef.current?.click()}>📎 Doc</button>
        <button className="cn-toolbar-btn" disabled={disabled} title="Share location"
          onClick={handleLocation}>📍 Location</button>
      </div>

      {/* Media Preview */}
      {mediaPreview && (
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", background: "#f0f7f0", borderRadius: 8, margin: "4px 12px" }}>
          {mediaPreview.type === "image" && mediaPreview.url
            ? <img src={mediaPreview.url} alt="preview" style={{ width: 48, height: 48, objectFit: "cover", borderRadius: 6 }} />
            : <span>📎</span>}
          <span style={{ flex: 1, fontSize: "0.8rem", color: "#555" }}>{mediaPreview.name}</span>
          <button onClick={() => setMediaPreview(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "#888" }}>✕</button>
        </div>
      )}

      {/* Recording Indicator */}
      {isRecording && (
        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", background: "#fee2e2", borderRadius: 8, margin: "4px 12px", color: "#ef4444", fontSize: "0.85rem", fontWeight: 600 }}>
          <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#ef4444", animation: "pulse 1s infinite", display: "inline-block" }} />
          🎤 Recording… {formatTime(recordingTime)} — Tap mic to stop
        </div>
      )}

      {/* Offer Mode Fields */}
      {isOfferMode && (
        <>
          <div className="cn-offer-mode-banner">
            <span className="cn-offer-mode-banner__title">💰 Creating a Price Offer</span>
            <button className="cn-offer-mode-banner__close" onClick={() => setIsOfferMode(false)}>✕</button>
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
        <textarea className="cn-input-row__field" rows={1}
          placeholder={isOfferMode ? "Add a note to your offer… (optional)" : "Type a message…"}
          value={isOfferMode ? offerData.note : text}
          onChange={(e) => isOfferMode ? setOfferData({ ...offerData, note: e.target.value }) : setText(e.target.value)}
          onKeyDown={handleKeyDown} disabled={disabled}
        />
        <div className="cn-input-actions">
          <button className={`cn-icon-btn${isRecording ? " active" : ""}`} disabled={disabled}
            title={isRecording ? "Stop recording" : "Record voice message"} onClick={handleVoice}
            style={{ color: isRecording ? "#ef4444" : undefined }}>🎤</button>
          <button className="cn-send-btn" onClick={handleSend}
            disabled={disabled || (isOfferMode ? !offerData.price || !offerData.crop : !text.trim() && !mediaPreview)}
            title="Send" aria-label="Send message">➤</button>
        </div>
      </div>
    </div>
  );
}

export default PriceInputPanel;
