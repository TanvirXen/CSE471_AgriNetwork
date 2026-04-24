import { useEffect, useRef } from "react";

const formatDuration = (secs) => {
  const m = Math.floor(secs / 60).toString().padStart(2, "0");
  const s = (secs % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
};

const STATUS_TEXT = {
  waiting: "Waiting for the other participant to join...",
  connecting: "Setting up secure connection...",
  ending: "Ending call...",
  error: "Could not connect",
};

function VideoCallModal({
  isOpen,
  status,
  conversation,
  localStream,
  remoteStream,
  errorMessage,
  isMuted,
  isCameraOff,
  isScreenSharing,
  callDuration,
  iceState,
  onEnd,
  onToggleMute,
  onToggleCamera,
  onToggleScreenShare,
}) {
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const remoteAudioRef = useRef(null);

  useEffect(() => {
    if (!localVideoRef.current) return;
    localVideoRef.current.srcObject = localStream || null;
    localVideoRef.current.play?.().catch(() => {});
  }, [localStream]);

  useEffect(() => {
    if (!remoteVideoRef.current) return;
    remoteVideoRef.current.srcObject = remoteStream || null;
    remoteVideoRef.current.play?.().catch(() => {});
  }, [remoteStream]);

  useEffect(() => {
    if (!remoteAudioRef.current) return;
    remoteAudioRef.current.srcObject = remoteStream || null;
    remoteAudioRef.current.play?.().catch(() => {});
  }, [remoteStream]);

  if (!isOpen) return null;

  const isCallActive = status === "waiting" || status === "connected" || status === "connecting";
  const isTerminal = status === "error" || status === "ending";
  const showIceWarning = iceState === "disconnected" || iceState === "failed";
  const hasRemoteMedia = Boolean(remoteStream?.getTracks?.().length);

  const statusText =
    status === "connected"
      ? formatDuration(callDuration || 0)
      : status === "error"
      ? errorMessage || STATUS_TEXT.error
      : STATUS_TEXT[status] || "";

  const remotePlaceholderText = status === "waiting"
    ? "Waiting for the other participant to join the room..."
    : status === "connecting"
    ? "Establishing secure P2P connection..."
    : status === "error"
    ? errorMessage || "Could not reach the other participant."
    : "Waiting for participant...";

  return (
    <div className="cn-call-overlay">
      <div
        className="cn-call-modal"
        role="dialog"
        aria-modal="true"
        aria-label="Video call"
      >
        <audio ref={remoteAudioRef} autoPlay playsInline />
        <div className="cn-call-modal__header">
          <div>
            <div className="cn-call-modal__name">{conversation?.name || "Video Call"}</div>
            <div className={`cn-call-modal__status${status === "connected" ? " cn-call-modal__status--timer" : ""}`}>
              {statusText}
            </div>
          </div>
          <div className="cn-call-modal__badges">
            {showIceWarning && (
              <span className="cn-call-modal__badge cn-call-modal__badge--warn">Reconnecting</span>
            )}
            <span className="cn-call-modal__badge">P2P WebRTC</span>
          </div>
        </div>

        <div className="cn-call-stage">
          <div className="cn-call-stage__remote">
            {hasRemoteMedia ? (
              <video ref={remoteVideoRef} autoPlay playsInline muted className="cn-call-video" />
            ) : (
              <div className="cn-call-placeholder">
                <div className="cn-call-placeholder__avatar">
                  {conversation?.avatar || conversation?.name?.slice(0, 2).toUpperCase() || "VC"}
                </div>
                <div className="cn-call-placeholder__text">{remotePlaceholderText}</div>
              </div>
            )}
          </div>

          {localStream && (
            <div className="cn-call-stage__local">
              {(!isCameraOff || isScreenSharing) ? (
                <video ref={localVideoRef} autoPlay playsInline muted className="cn-call-video" />
              ) : (
                <div className="cn-call-local-placeholder">
                  {isScreenSharing ? "Sharing" : "Cam Off"}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="cn-call-controls">
          {isCallActive && (
            <>
              <button
                className={`cn-call-btn${isMuted ? " cn-call-btn--active" : ""}`}
                onClick={onToggleMute}
                title={isMuted ? "Unmute" : "Mute"}
              >
                {isMuted ? "Unmute" : "Mute"}
              </button>
              <button
                className={`cn-call-btn${isCameraOff ? " cn-call-btn--active" : ""}`}
                onClick={onToggleCamera}
                title={isCameraOff ? "Turn camera on" : "Turn camera off"}
              >
                {isCameraOff ? "Cam On" : "Cam Off"}
              </button>
              <button
                className={`cn-call-btn${isScreenSharing ? " cn-call-btn--active" : ""}`}
                onClick={onToggleScreenShare}
                title={isScreenSharing ? "Stop sharing screen" : "Share your screen"}
                disabled={status !== "connected"}
              >
                {isScreenSharing ? "Stop Share" : "Share Screen"}
              </button>
              <button className="cn-call-btn cn-call-btn--decline" onClick={onEnd} title="End call">
                End Call
              </button>
            </>
          )}

          {(isTerminal || !isCallActive) && (
            <button className="cn-call-btn cn-call-btn--decline" onClick={onEnd}>
              Close
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default VideoCallModal;
