import { useEffect, useRef } from "react";

function VideoCallModal({
  isOpen,
  status,
  conversation,
  localStream,
  remoteStream,
  isMuted,
  isCameraOff,
  incoming,
  onAccept,
  onDecline,
  onEnd,
  onToggleMute,
  onToggleCamera,
}) {
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);

  useEffect(() => {
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = localStream || null;
    }
  }, [localStream]);

  useEffect(() => {
    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = remoteStream || null;
    }
  }, [remoteStream]);

  if (!isOpen) return null;

  return (
    <div className="cn-call-overlay">
      <div className="cn-call-modal" role="dialog" aria-modal="true" aria-label="Video call">
        <div className="cn-call-modal__header">
          <div>
            <div className="cn-call-modal__name">{conversation?.name || "Video call"}</div>
            <div className="cn-call-modal__status">
              {status === "incoming" && "Incoming video call"}
              {status === "outgoing" && "Calling..."}
              {status === "connecting" && "Connecting..."}
              {status === "connected" && "Connected"}
              {status === "ending" && "Ending call..."}
              {status === "error" && "Call unavailable"}
            </div>
          </div>
          <div className="cn-call-modal__badge">P2P WebRTC</div>
        </div>

        <div className="cn-call-stage">
          <div className="cn-call-stage__remote">
            {remoteStream ? (
              <video ref={remoteVideoRef} autoPlay playsInline className="cn-call-video" />
            ) : (
              <div className="cn-call-placeholder">
                <div className="cn-call-placeholder__avatar">
                  {conversation?.avatar || conversation?.name?.slice(0, 2).toUpperCase() || "VC"}
                </div>
                <div className="cn-call-placeholder__text">
                  {incoming ? `${conversation?.name} is calling you` : "Waiting for the other participant to join"}
                </div>
              </div>
            )}
          </div>

          <div className="cn-call-stage__local">
            {localStream && !isCameraOff ? (
              <video ref={localVideoRef} autoPlay playsInline muted className="cn-call-video" />
            ) : (
              <div className="cn-call-local-placeholder">
                {isCameraOff ? "Camera Off" : "Camera Preview"}
              </div>
            )}
          </div>
        </div>

        <div className="cn-call-controls">
          {status === "incoming" ? (
            <>
              <button className="cn-call-btn cn-call-btn--decline" onClick={onDecline}>Decline</button>
              <button className="cn-call-btn cn-call-btn--accept" onClick={onAccept}>Accept</button>
            </>
          ) : (
            <>
              <button className="cn-call-btn" onClick={onToggleMute}>
                {isMuted ? "Unmute" : "Mute"}
              </button>
              <button className="cn-call-btn" onClick={onToggleCamera}>
                {isCameraOff ? "Camera On" : "Camera Off"}
              </button>
              <button className="cn-call-btn cn-call-btn--decline" onClick={onEnd}>End Call</button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default VideoCallModal;
