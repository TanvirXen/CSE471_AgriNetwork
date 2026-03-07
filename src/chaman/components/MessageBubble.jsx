// MessageBubble.jsx — AgriNetwork Bangladesh
// Single message row — plain text or negotiation card (type="negotiation")
import NegotiationCard from "./NegotiationCard";

/**
 * Props:
 *  message: {
 *    id, type: "text"|"negotiation"|"status",
 *    text, timestamp, isSent,
 *    senderInitials,
 *    -- if type === "negotiation" --
 *    negType, crop, quantity, offerPrice, marketPrice, unit
 *  }
 *  onAcceptOffer, onRejectOffer, onCounterOffer — callbacks for negotiation actions
 */
function MessageBubble({ message, onAcceptOffer, onRejectOffer, onCounterOffer }) {
    const { type, isSent, senderInitials, timestamp, text } = message;

    // Status / system message
    if (type === "status") {
        return (
            <div className={`cn-status-msg${message.dealClosed ? " deal-closed" : ""}`}>
                {text}
            </div>
        );
    }

    // Date divider
    if (type === "date") {
        return (
            <div className="cn-date-divider">
                <span>{text}</span>
            </div>
        );
    }

    // Negotiation offer card
    if (type === "negotiation") {
        return (
            <div className={`cn-msg-row ${isSent ? "sent" : "received"}`}>
                {!isSent && (
                    <div className="cn-msg-avatar">{senderInitials}</div>
                )}
                <div className="cn-msg-stack">
                    <NegotiationCard
                        type={message.negType}
                        crop={message.crop}
                        quantity={message.quantity}
                        offerPrice={message.offerPrice}
                        marketPrice={message.marketPrice}
                        unit={message.unit || "৳/kg"}
                        isSender={isSent}
                        onAccept={() => onAcceptOffer && onAcceptOffer(message.id)}
                        onReject={() => onRejectOffer && onRejectOffer(message.id)}
                        onCounter={() => onCounterOffer && onCounterOffer(message.id)}
                    />
                    <div className="cn-msg-timestamp" style={isSent ? {} : { justifyContent: "flex-start" }}>
                        {timestamp}
                        {isSent && <span>✓✓</span>}
                    </div>
                </div>
                {isSent && (
                    <div className="cn-msg-avatar" style={{ background: "linear-gradient(135deg, #344e41, #3a5a40)" }}>
                        You
                    </div>
                )}
            </div>
        );
    }

    // Plain text message
    return (
        <div className={`cn-msg-row ${isSent ? "sent" : "received"}`}>
            {!isSent && (
                <div className="cn-msg-avatar">{senderInitials}</div>
            )}
            <div className="cn-msg-stack">
                <div className="cn-msg-bubble">{text}</div>
                <div className="cn-msg-timestamp">
                    {timestamp}
                    {isSent && <span>✓✓</span>}
                </div>
            </div>
            {isSent && (
                <div className="cn-msg-avatar" style={{ background: "linear-gradient(135deg, #344e41, #3a5a40)" }}>
                    You
                </div>
            )}
        </div>
    );
}

export default MessageBubble;
