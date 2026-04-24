// MessageBubble.jsx — AgriNetwork Bangladesh
// Single message row — plain text or negotiation card (type="negotiation")
import NegotiationCard from "./NegotiationCard";
import { buildMediaUrl } from "../../../config/network";

/**
 * Props:
 *  message: {
 *    id, type: "text"|"negotiation"|"status"|"video_call",
 *    text, timestamp, isSent,
 *    senderInitials,
 *    -- if type === "negotiation" --
 *    negType, crop, quantity, offerPrice, marketPrice, unit
 *  }
 *  onAcceptOffer, onRejectOffer, onCounterOffer, onJoinVideoCall — callbacks for actions
 */
function MessageBubble({
    message,
    onAcceptOffer,
    onRejectOffer,
    onCounterOffer,
    onJoinVideoCall,
    joiningCallId,
    activeCallId,
}) {
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

    if (type === "video_call") {
        const isJoining = joiningCallId === message.callId;
        const isActive = activeCallId === message.callId;
        const statusLabel = {
            Ongoing: "Live",
            Scheduled: "Scheduled",
            Completed: "Ended",
            Cancelled: "Cancelled",
            Missed: "Missed",
        }[message.callStatus] || "Call";

        let actionLabel = null;
        let actionDisabled = true;

        if (!isSent) {
            if (isActive) {
                actionLabel = "Call Active";
            } else if (isJoining) {
                actionLabel = "Joining...";
            } else if (message.callCanJoin) {
                actionLabel = "Join Call";
                actionDisabled = false;
            } else if (message.callJoined) {
                actionLabel = "Joined";
            } else {
                actionLabel = statusLabel;
            }
        }

        return (
            <div className={`cn-msg-row ${isSent ? "sent" : "received"}`}>
                {!isSent && (
                    <div className="cn-msg-avatar">{senderInitials}</div>
                )}
                <div className="cn-msg-stack">
                    <div className={`cn-call-invite-card${isSent ? " sent" : ""}`}>
                        <div className="cn-call-invite-card__top">
                            <span className="cn-call-invite-card__badge">Video Call</span>
                            <span className="cn-call-invite-card__status">{statusLabel}</span>
                        </div>
                        <div className="cn-call-invite-card__title">
                            {isSent ? "Call started" : "Join video call"}
                        </div>
                        <div className="cn-call-invite-card__text">
                            {text || "A video call invitation is available for this chat."}
                        </div>
                        {actionLabel && (
                            <button
                                type="button"
                                className={`cn-btn ${actionDisabled ? "cn-btn--ghost" : "cn-btn--primary"} cn-call-invite-card__action`}
                                onClick={() => !actionDisabled && onJoinVideoCall && onJoinVideoCall(message)}
                                disabled={actionDisabled}
                            >
                                {actionLabel}
                            </button>
                        )}
                    </div>
                    <div className="cn-msg-timestamp" style={isSent ? {} : { justifyContent: "flex-start" }}>
                        {timestamp}
                        {isSent && <span>âœ“âœ“</span>}
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

    // Multimedia: Image
    if (type === "image") {
        return (
            <div className={`cn-msg-row ${isSent ? "sent" : "received"}`}>
                {!isSent && <div className="cn-msg-avatar">{senderInitials}</div>}
                <div className="cn-msg-stack">
                    <div className="cn-msg-media cn-msg-media--image">
                        <img src={buildMediaUrl(message.mediaUrl)} alt="Sent media" />
                    </div>
                    <div className="cn-msg-timestamp">
                        {timestamp}
                        {isSent && <span>✓✓</span>}
                    </div>
                </div>
                {isSent && <div className="cn-msg-avatar" style={{ background: "linear-gradient(135deg, #344e41, #3a5a40)" }}>You</div>}
            </div>
        );
    }

    // Multimedia: Audio
    if (type === "audio") {
        return (
            <div className={`cn-msg-row ${isSent ? "sent" : "received"}`}>
                {!isSent && <div className="cn-msg-avatar">{senderInitials}</div>}
                <div className="cn-msg-stack">
                    <div className="cn-msg-media cn-msg-media--audio">
                        <audio controls src={buildMediaUrl(message.mediaUrl)} />
                    </div>
                    <div className="cn-msg-timestamp">
                        {timestamp}
                        {isSent && <span>✓✓</span>}
                    </div>
                </div>
                {isSent && <div className="cn-msg-avatar" style={{ background: "linear-gradient(135deg, #344e41, #3a5a40)" }}>You</div>}
            </div>
        );
    }

    // Multimedia: File
    if (type === "file") {
        return (
            <div className={`cn-msg-row ${isSent ? "sent" : "received"}`}>
                {!isSent && <div className="cn-msg-avatar">{senderInitials}</div>}
                <div className="cn-msg-stack">
                    <div className="cn-msg-bubble cn-msg-bubble--file">
                        <a href={buildMediaUrl(message.mediaUrl)} target="_blank" rel="noopener noreferrer">
                            📄 Download Document
                        </a>
                    </div>
                    <div className="cn-msg-timestamp">
                        {timestamp}
                        {isSent && <span>✓✓</span>}
                    </div>
                </div>
                {isSent && <div className="cn-msg-avatar" style={{ background: "linear-gradient(135deg, #344e41, #3a5a40)" }}>You</div>}
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
