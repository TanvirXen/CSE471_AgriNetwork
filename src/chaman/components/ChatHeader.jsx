// ChatHeader.jsx — AgriNetwork Bangladesh
// Top bar of the active chat showing user info + deal progress

const DEAL_STEPS = [
    { label: "Inquiry" },
    { label: "Offer" },
    { label: "Negotiating" },
    { label: "Agreed" },
    { label: "Confirmed" },
];

function ChatHeader({ conversation, activeStep = 2, onToggleSidebar }) {
    if (!conversation) return null;

    return (
        <>
            {/* User Info Header */}
            <header className="cn-chat-header">
                <button
                    className="cn-icon-btn cn-mob-toggle"
                    onClick={onToggleSidebar}
                    aria-label="Toggle sidebar"
                >
                    ☰
                </button>

                <div className="cn-chat-header__avatar" title="View profile">
                    {conversation.avatar}
                </div>

                <div className="cn-chat-header__info">
                    <div className="cn-chat-header__name">{conversation.name}</div>
                    <div className="cn-chat-header__meta">
                        {conversation.online ? (
                            <>
                                <span className="cn-chat-header__status-dot" />
                                Online · Active now
                            </>
                        ) : (
                            "Offline"
                        )}
                    </div>
                </div>

                {/* Crop Tag */}
                <div className="cn-chat-header__crop-tag">
                    🌾 {conversation.crop}
                </div>

                {/* Action Buttons */}
                <div className="cn-chat-header__actions">
                    <button className="cn-icon-btn" title="View profile">👤</button>
                    <button className="cn-icon-btn" title="Phone call">📞</button>
                    <button className="cn-icon-btn" title="More options">⋯</button>
                </div>
            </header>

            {/* Deal Progress Banner */}
            <div className="cn-deal-banner">
                <span className="cn-deal-banner__label">Deal Progress</span>
                <div className="cn-deal-steps">
                    {DEAL_STEPS.map((step, idx) => {
                        const status =
                            idx < activeStep ? "done" : idx === activeStep ? "active" : "";
                        return (
                            <div key={idx} className="cn-deal-step" style={{ display: "flex", alignItems: "center" }}>
                                {idx > 0 && (
                                    <div
                                        className={`cn-deal-step__line${idx <= activeStep ? " cn-deal-step__line--done" : ""}`}
                                    />
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
        </>
    );
}

export default ChatHeader;
