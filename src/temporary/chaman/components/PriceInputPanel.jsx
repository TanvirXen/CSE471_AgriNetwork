// PriceInputPanel.jsx — AgriNetwork Bangladesh
// Bottom input area — text messages + offer mode trigger

import { useState } from "react";

/**
 * Props:
 *  onSendMessage  : fn(text)
 *  onSendOffer    : fn({ crop, quantity, price, unit, note })
 *  isOfferMode    : bool
 *  setIsOfferMode : fn
 *  disabled       : bool
 */
function PriceInputPanel({
    onSendMessage,
    onSendOffer,
    isOfferMode,
    setIsOfferMode,
    disabled = false,
}) {
    const [text, setText] = useState("");
    const [offerData, setOfferData] = useState({
        crop: "",
        quantity: "",
        price: "",
        unit: "৳/kg",
        note: "",
    });

    const handleSend = () => {
        if (isOfferMode) {
            if (!offerData.price || !offerData.crop) return;
            onSendOffer && onSendOffer(offerData);
            setOfferData({ crop: "", quantity: "", price: "", unit: "৳/kg", note: "" });
            setIsOfferMode(false);
        } else {
            if (!text.trim()) return;
            onSendMessage && onSendMessage(text.trim());
            setText("");
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <div className="cn-input-panel">
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
                <button className="cn-toolbar-btn" disabled={disabled} title="Attach image">
                    📷 Photo
                </button>
                <button className="cn-toolbar-btn" disabled={disabled} title="Attach document">
                    📎 Doc
                </button>
                <button className="cn-toolbar-btn" disabled={disabled} title="Share location">
                    📍 Location
                </button>
            </div>

            {/* Offer Mode Banner + Fields */}
            {isOfferMode && (
                <>
                    <div className="cn-offer-mode-banner">
                        <span className="cn-offer-mode-banner__title">
                            💰 Creating a Price Offer
                        </span>
                        <button
                            className="cn-offer-mode-banner__close"
                            onClick={() => setIsOfferMode(false)}
                            aria-label="Close offer mode"
                        >
                            ✕
                        </button>
                    </div>

                    <div className="cn-offer-inputs">
                        <div className="cn-offer-field">
                            <label>Crop / Product</label>
                            <input
                                placeholder="e.g. Rice (Miniket)"
                                value={offerData.crop}
                                onChange={(e) => setOfferData({ ...offerData, crop: e.target.value })}
                            />
                        </div>
                        <div className="cn-offer-field">
                            <label>Quantity</label>
                            <input
                                placeholder="e.g. 200 kg"
                                value={offerData.quantity}
                                onChange={(e) => setOfferData({ ...offerData, quantity: e.target.value })}
                            />
                        </div>
                        <div className="cn-offer-field">
                            <label>Your Price</label>
                            <input
                                type="number"
                                placeholder="e.g. 55"
                                value={offerData.price}
                                onChange={(e) => setOfferData({ ...offerData, price: e.target.value })}
                            />
                        </div>
                        <div className="cn-offer-field">
                            <label>Unit</label>
                            <select
                                value={offerData.unit}
                                onChange={(e) => setOfferData({ ...offerData, unit: e.target.value })}
                            >
                                <option>৳/kg</option>
                                <option>৳/quintal</option>
                                <option>৳/ton</option>
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
                    placeholder={
                        isOfferMode
                            ? "Add a note to your offer… (optional)"
                            : "Type a message…"
                    }
                    value={isOfferMode ? offerData.note : text}
                    onChange={(e) =>
                        isOfferMode
                            ? setOfferData({ ...offerData, note: e.target.value })
                            : setText(e.target.value)
                    }
                    onKeyDown={handleKeyDown}
                    disabled={disabled}
                />

                <div className="cn-input-actions">
                    <button className="cn-icon-btn" disabled={disabled} title="Record voice">
                        🎤
                    </button>
                    <button
                        className="cn-send-btn"
                        onClick={handleSend}
                        disabled={disabled || (isOfferMode ? !offerData.price || !offerData.crop : !text.trim())}
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
