import { useEffect, useRef } from "react";

const formatDuration = (secs) => {
  const m = Math.floor(secs / 60).toString().padStart(2, "0");
  const s = (secs % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
};

const STATUS_TEXT = {
  outgoing: "Calling...",
  connecting: "Setting up secure connection...",
  ending: "Ending call...",
  declined: "Call was declined",
  error: "Could not connect",
};

function VideoCallModal({
  isOpen,
  status,
  conversation,
  localStream,
  remoteStream,
  isMuted,
  isCameraOff,
  isScreenSharing,
  incoming,
  callDuration,
  iceState,
  onAccept,
  onDecline,
  onEnd,
  onToggleMute,
  onToggleCamera,
  onToggleScreenShare,
}) {
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);

  useEffect(() => {
    if (localVideoRef.current) localVideoRef.current.srcObject = localStream || null;
  }, [localStream]);

  useEffect(() => {
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = remoteStream || null;
  }, [remoteStream]);

  if (!isOpen) return null;

  const isIncoming = status === "incoming";
  const isCallActive = status === "connected" || status === "connecting";
  const isTerminal = status === "declined" || status === "error" || status === "ending";
  const showIceWarning = iceState === "disconnected" || iceState === "failed";

  const statusText =
    status === "connected"
      ? formatDuration(callDuration || 0)
      : STATUS_TEXT[status] ||
        (isIncoming ? `${conversation?.name || "Someone"} is calling you...` : "");

  const remotePlaceholderText = isIncoming
    ? `${conversation?.name || "Someone"} is calling you...`
    : status === "outgoing"
    ? "Waiting for the other party to answer..."
    : status === "connecting"
    ? "Establishing secure P2P connection..."
    : status === "declined"
    ? "The other party declined the call."
    : status === "error"
    ? "Could not reach the other party."
    : "Waiting for participant...";

  return (
    <div className="cn-call-overlay">
      <div
        className={`cn-call-modal${isIncoming ? " cn-call-modal--ringing" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-label="Video call"
      >
        {/* Header */}
        <div className="cn-call-modal__header">
          <div>
            <div className="cn-call-modal__name">{conversation?.name || "Video Call"}</div>
            <div className={`cn-call-modal__status${status === "connected" ? " cn-call-modal__status--timer" : ""}`}>
              {statusText}
            </div>
          </div>
          <div className="cn-call-modal__badges">
            {showIceWarning && (
              <span className="cn-call-modal__badge cn-call-modal__badge--warn">⚠ Reconnecting</span>
            )}
            <span className="cn-call-modal__badge">P2P WebRTC</span>
          </div>
        </div>

        {/* Video stage */}
        <div className="cn-call-stage">
          {/* Remote / main video */}
          <div className="cn-call-stage__remote">
            {remoteStream ? (
              <video ref={remoteVideoRef} autoPlay playsInline className="cn-call-video" />
            ) : (
              <div className={`cn-call-placeholder${isIncoming ? " cn-call-placeholder--ringing" : ""}`}>
                <div className="cn-call-placeholder__avatar">
                  {conversation?.avatar || conversation?.name?.slice(0, 2).toUpperCase() || "VC"}
                </div>
                <div className="cn-call-placeholder__text">{remotePlaceholderText}</div>
              </div>
            )}
          </div>

          {/* Local picture-in-picture */}
          {localStream && (
            <div className="cn-call-stage__local">
              {!isCameraOff && !isScreenSharing ? (
                <video ref={localVideoRef} autoPlay playsInline muted className="cn-call-video" />
              ) : (
                <div className="cn-call-local-placeholder">
                  {isScreenSharing ? "📺 Sharing" : "Cam Off"}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="cn-call-controls">
          {isIncoming && (
            <>
              <button className="cn-call-btn cn-call-btn--decline" onClick={onDecline} title="Decline">
                📵 Decline
              </button>
              <button className="cn-call-btn cn-call-btn--accept" onClick={onAccept} title="Accept">
                📞 Accept
              </button>
            </>
          )}

          {isCallActive && (
            <>
              <button
                className={`cn-call-btn${isMuted ? " cn-call-btn--active" : ""}`}
                onClick={onToggleMute}
                title={isMuted ? "Unmute" : "Mute"}
              >
                {isMuted ? "🔇 Unmute" : "🎤 Mute"}
              </button>
              <button
                className={`cn-call-btn${isCameraOff ? " cn-call-btn--active" : ""}`}
                onClick={onToggleCamera}
                title={isCameraOff ? "Turn camera on" : "Turn camera off"}
              >
                {isCameraOff ? "📷 Cam On" : "📹 Cam Off"}
              </button>
              <button
                className={`cn-call-btn${isScreenSharing ? " cn-call-btn--active" : ""}`}
                onClick={onToggleScreenShare}
                title={isScreenSharing ? "Stop sharing screen" : "Share your screen"}
              >
                🖥️ {isScreenSharing ? "Stop Share" : "Share Screen"}
              </button>
              <button className="cn-call-btn cn-call-btn--decline" onClick={onEnd} title="End call">
                📵 End Call
              </button>
            </>
          )}

          {(isTerminal || (!isIncoming && !isCallActive)) && (
            <button className="cn-call-btn cn-call-btn--decline" onClick={onEnd || onDecline}>
              ✕ Close
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default VideoCallModal;
