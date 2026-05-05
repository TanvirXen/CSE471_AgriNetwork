// ChatNegotiationPage (index.jsx) — AgriNetwork Bangladesh
// Full Chat + Live Price Negotiation page — Connected to Backend

import { useState, useRef, useEffect, useCallback } from "react";
import { useLocation } from "react-router-dom";
import { io } from "socket.io-client";
import "./ChatNegotiation.css";

import LivePriceTicker from "./components/LivePriceTicker";
import ChatSidebar from "./components/ChatSidebar";
import ChatHeader from "./components/ChatHeader";
import MessageBubble from "./components/MessageBubble";
import PriceInputPanel from "./components/PriceInputPanel";
import VideoCallModal from "./components/VideoCallModal";

import { useAuth } from "../../context/AuthContext";
import { API_BASE_URL as API_BASE, SOCKET_URL } from "../../config/network";
const ICE_SERVERS = [{ urls: "stun:stun.l.google.com:19302" }];
const MEDIA_SECURE_CONTEXT_MESSAGE =
  "Camera and microphone permissions require HTTPS or localhost. Open AgriNetwork on https://<your-ip>:5173 or http://localhost:5173 and allow access.";
const MEDIA_CAMERA_REQUIRED_MESSAGE =
  "Video call needs camera access on both devices. Allow camera permission in the browser and try again.";
const MEDIA_MIC_REQUIRED_MESSAGE =
  "Video call needs microphone access on both devices. Allow microphone permission in the browser and try again.";

const getMediaAccessErrorMessage = (error) => {
  if (typeof window !== "undefined" && !window.isSecureContext) {
    return MEDIA_SECURE_CONTEXT_MESSAGE;
  }

  switch (error?.name) {
    case "NotAllowedError":
      return "Camera or microphone permission was blocked. Allow access in the browser and try again.";
    case "NotFoundError":
      return "No camera or microphone device was found on this device.";
    case "NotReadableError":
    case "TrackStartError":
      return "Camera or microphone is busy in another app. Close that app and retry.";
    case "SecurityError":
      return MEDIA_SECURE_CONTEXT_MESSAGE;
    case "VideoTrackMissingError":
      return MEDIA_CAMERA_REQUIRED_MESSAGE;
    case "AudioTrackMissingError":
      return MEDIA_MIC_REQUIRED_MESSAGE;
    default:
      return error?.message || "Unable to access camera or microphone.";
  }
};

const getLiveTrackByKind = (stream, kind) =>
  stream?.getTracks?.().find((track) => track.kind === kind && track.readyState === "live") || null;

const mergeMediaStreams = (...streams) => {
  const mergedStream = new MediaStream();
  const seenTrackIds = new Set();

  streams
    .filter(Boolean)
    .forEach((stream) =>
      stream.getTracks().forEach((track) => {
        if (track.readyState !== "live" || seenTrackIds.has(track.id)) {
          return;
        }

        seenTrackIds.add(track.id);
        mergedStream.addTrack(track);
      })
    );

  return mergedStream;
};

const getMockLivePrice = (cropName) => {
  if (!cropName) return 58;
  const c = cropName.toLowerCase();
  if (c.includes("tomato") || c.includes("টমেটো")) return 40;
  if (c.includes("rice") || c.includes("চাল")) return 65;
  if (c.includes("wheat") || c.includes("গম")) return 38;
  if (c.includes("potato") || c.includes("আলু")) return 25;
  if (c.includes("onion") || c.includes("পেঁয়াজ")) return 50;
  if (c.includes("mango") || c.includes("আম")) return 120;
  return 58; 
};

const getEntityId = (value) => {
  const rawValue = value?._id || value?.id || value;
  return rawValue ? rawValue.toString() : "";
};

const getVideoCallMessageMeta = ({ call, currentUserId, isSent }) => {
  const participants = Array.isArray(call?.participants) ? call.participants : [];
  const currentParticipant = participants.find(
    (participant) => getEntityId(participant?.userId) === currentUserId
  );
  const callStatus = call?.callStatus || "Ongoing";

  return {
    callId: getEntityId(call),
    callRoomId: call?.roomId || null,
    callStatus,
    callJoined: Boolean(currentParticipant?.joinedAt && !currentParticipant?.leftAt),
    callCanJoin:
      !isSent &&
      ["Scheduled", "Ongoing"].includes(callStatus) &&
      !currentParticipant?.joinedAt,
  };
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
            <input placeholder="e.g. Premium Rice (Miniket)" value={data.crop}
              onChange={(e) => setData({ ...data, crop: e.target.value })} required />
          </div>

          <div className="cn-modal__grid-2">
            <div className="cn-modal__field">
              <label>Quantity</label>
              <input placeholder="e.g. 200 kg" value={data.quantity}
                onChange={(e) => setData({ ...data, quantity: e.target.value })} />
            </div>
            <div className="cn-modal__field">
              <label>Unit</label>
              <select value={data.unit} onChange={(e) => setData({ ...data, unit: e.target.value })}>
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
            <input type="number" placeholder="Enter amount" value={data.price}
              onChange={(e) => setData({ ...data, price: e.target.value })} required min="1" />
          </div>

          <div className="cn-modal__field">
            <label>Note (optional)</label>
            <textarea placeholder="Any additional terms, delivery info, or remarks…"
              value={data.note} onChange={(e) => setData({ ...data, note: e.target.value })} />
          </div>

          <div className="cn-modal__actions">
            <button type="button" className="cn-btn cn-btn--ghost" onClick={onClose}>Cancel</button>
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
  const { user, token } = useAuth();
  const location = useLocation();

  const [extraConvs, setExtraConvs] = useState([]);
  const [activeConv, setActiveConv] = useState(null);
  const [messages, setMessages] = useState([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isOfferMode, setIsOfferMode] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [counterFor, setCounterFor] = useState(null);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [callState, setCallState] = useState({
    isOpen: false,
    status: "idle",
    callId: null,
    roomId: null,
    conversationId: null,
    isHost: false,
  });
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [iceState, setIceState] = useState("new");
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [joiningCallId, setJoiningCallId] = useState(null);
  const [callErrorMessage, setCallErrorMessage] = useState("");
  const [localPreviewStream, setLocalPreviewStream] = useState(null);
  const messagesEndRef = useRef(null);
  const socketRef = useRef(null);
  const peerConnectionRef = useRef(null);
  const pendingIceCandidatesRef = useRef([]);
  const localStreamRef = useRef(null);
  const remoteStreamRef = useRef(null);
  const localPreviewStreamRef = useRef(null);
  const mediaTransceiversRef = useRef({ audio: null, video: null });
  const activeConvRef = useRef(null);
  const callStateRef = useRef(callState);
  const screenStreamRef = useRef(null);
  const callTimerRef = useRef(null);
  const finishCallRef = useRef(null);
  const cameraOffRef = useRef(isCameraOff);
  const senderInitials = user?.fullName
    ? user.fullName.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : "You";

  const buildVideoCallMessage = useCallback(
    ({ id, isSent, senderAvatar, text, timestamp, call }) => ({
      id,
      type: "video_call",
      isSent,
      senderInitials: senderAvatar,
      text: text || "Video call invitation",
      timestamp,
      ...getVideoCallMessageMeta({
        call,
        currentUserId: user?._id?.toString() || "",
        isSent,
      }),
    }),
    [user?._id]
  );

  const upsertChatMessage = useCallback((nextMessage) => {
    setMessages((prev) => {
      const existingIndex = prev.findIndex(
        (item) => item.id === nextMessage.id || (nextMessage.callId && item.callId === nextMessage.callId)
      );

      if (existingIndex === -1) {
        return [...prev, nextMessage];
      }

      const nextMessages = [...prev];
      nextMessages[existingIndex] = { ...nextMessages[existingIndex], ...nextMessage };
      return nextMessages;
    });
  }, []);

  const updateCallMessageState = useCallback((callId, changes) => {
    if (!callId) return;

    setMessages((prev) =>
      prev.map((message) =>
        message.callId === callId
          ? {
              ...message,
              ...changes,
            }
          : message
      )
    );
  }, []);

  const applyCallState = useCallback((nextStateOrUpdater) => {
    const nextState =
      typeof nextStateOrUpdater === "function"
        ? nextStateOrUpdater(callStateRef.current)
        : nextStateOrUpdater;

    callStateRef.current = nextState;
    setCallState(nextState);
  }, []);

  useEffect(() => {
    localStreamRef.current = localStream;
  }, [localStream]);

  useEffect(() => {
    remoteStreamRef.current = remoteStream;
  }, [remoteStream]);

  useEffect(() => {
    localPreviewStreamRef.current = localPreviewStream;
  }, [localPreviewStream]);

  useEffect(() => {
    activeConvRef.current = activeConv;
  }, [activeConv]);

  useEffect(() => {
    callStateRef.current = callState;
  }, [callState]);

  useEffect(() => {
    cameraOffRef.current = isCameraOff;
  }, [isCameraOff]);

  const stopMediaStream = useCallback((stream) => {
    stream?.getTracks?.().forEach((track) => track.stop());
  }, []);

  const setLocalPreviewTrack = useCallback(
    (track) => {
      stopMediaStream(localPreviewStreamRef.current);
      localPreviewStreamRef.current = null;

      if (!track || track.readyState !== "live" || track.enabled === false) {
        setLocalPreviewStream(null);
        return;
      }

      const previewTrack = track.clone();
      const previewStream = new MediaStream([previewTrack]);
      localPreviewStreamRef.current = previewStream;
      setLocalPreviewStream(previewStream);
    },
    [stopMediaStream]
  );

  const getMediaTransceiver = useCallback((pc, kind, { createIfMissing = true } = {}) => {
    if (!pc) return null;

    const cachedTransceiver = mediaTransceiversRef.current?.[kind];
    if (cachedTransceiver && !cachedTransceiver.stopped) {
      return cachedTransceiver;
    }

    const existingTransceiver = pc.getTransceivers().find((transceiver) => {
      const receiverKind = transceiver.receiver?.track?.kind;
      const senderKind = transceiver.sender?.track?.kind;
      return receiverKind === kind || senderKind === kind;
    });

    if (existingTransceiver && !existingTransceiver.stopped) {
      mediaTransceiversRef.current[kind] = existingTransceiver;
      return existingTransceiver;
    }

    if (!createIfMissing) {
      return null;
    }

    const nextTransceiver = pc.addTransceiver(kind, { direction: "sendrecv" });
    mediaTransceiversRef.current[kind] = nextTransceiver;
    return nextTransceiver;
  }, []);

  const resetCallResources = useCallback(() => {
    if (peerConnectionRef.current) {
      peerConnectionRef.current.onicecandidate = null;
      peerConnectionRef.current.ontrack = null;
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }

    stopMediaStream(localStreamRef.current);
    stopMediaStream(remoteStreamRef.current);
    stopMediaStream(localPreviewStreamRef.current);
    localStreamRef.current = null;
    remoteStreamRef.current = null;
    localPreviewStreamRef.current = null;
    mediaTransceiversRef.current = { audio: null, video: null };
    screenStreamRef.current?.getTracks().forEach((t) => t.stop());
    screenStreamRef.current = null;
    setLocalStream(null);
    setLocalPreviewStream(null);
    setRemoteStream(null);
    setIsMuted(false);
    setIsCameraOff(false);
    setIsScreenSharing(false);
    clearInterval(callTimerRef.current);
    setCallDuration(0);
    setIceState("new");
    pendingIceCandidatesRef.current = [];
  }, [stopMediaStream]);

  const createPeerConnection = useCallback((roomId) => {
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
    }

    mediaTransceiversRef.current = { audio: null, video: null };
    const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
    const incomingRemoteStream = new MediaStream();
    remoteStreamRef.current = incomingRemoteStream;
    setRemoteStream(incomingRemoteStream);

    pc.onicecandidate = (event) => {
      if (event.candidate && roomId) {
        socketRef.current?.emit("video_call_ice_candidate", {
          roomId,
          candidate: event.candidate,
        });
      }
    };

    pc.ontrack = (event) => {
      const incomingTracks =
        event.streams?.[0]?.getTracks?.().length > 0 ? event.streams[0].getTracks() : [event.track];

      incomingTracks.forEach((track) => {
        if (!incomingRemoteStream.getTracks().some((existingTrack) => existingTrack.id === track.id)) {
          incomingRemoteStream.addTrack(track);
        }
      });

      remoteStreamRef.current = incomingRemoteStream;
      setRemoteStream(incomingRemoteStream);
      applyCallState((prev) => ({ ...prev, status: "connected" }));
    };

    pc.oniceconnectionstatechange = () => {
      setIceState(pc.iceConnectionState);
      if (pc.iceConnectionState === "failed") {
        applyCallState((prev) => ({ ...prev, status: "error" }));
      }
    };

    peerConnectionRef.current = pc;
    return pc;
  }, [applyCallState, getMediaTransceiver]);

  const ensureLocalMedia = useCallback(async ({ required = true } = {}) => {
    if (localStreamRef.current) {
      const hasLiveAudio = Boolean(getLiveTrackByKind(localStreamRef.current, "audio"));
      const hasLiveVideo = Boolean(getLiveTrackByKind(localStreamRef.current, "video"));
      const hasLiveTrack = hasLiveAudio || hasLiveVideo;

      if (hasLiveAudio && hasLiveVideo) {
        setLocalPreviewTrack(
          getLiveTrackByKind(screenStreamRef.current, "video") ||
          getLiveTrackByKind(localStreamRef.current, "video")
        );
        return localStreamRef.current;
      }

      if (!hasLiveTrack) {
        stopMediaStream(localStreamRef.current);
        localStreamRef.current = null;
      }
    }

    if (typeof window !== "undefined" && !window.isSecureContext) {
      const secureContextError = new Error(MEDIA_SECURE_CONTEXT_MESSAGE);
      secureContextError.name = "SecurityError";
      if (required) {
        throw secureContextError;
      }
      return null;
    }

    if (!navigator.mediaDevices?.getUserMedia) {
      if (required) {
        throw new Error("Camera or microphone access is not supported in this browser.");
      }
      return null;
    }

    let lastError = null;
    const requestUserMedia = async (constraints) => {
      try {
        return await navigator.mediaDevices.getUserMedia(constraints);
      } catch (err) {
        lastError = err;
        return null;
      }
    };

    let nextStream = localStreamRef.current;
    const hasReusableTrack = nextStream?.getTracks?.().some((track) => track.readyState === "live");

    if (!hasReusableTrack) {
      nextStream = await requestUserMedia({ video: true, audio: true });
    }

    let audioTrack = getLiveTrackByKind(nextStream, "audio");
    let videoTrack = getLiveTrackByKind(nextStream, "video");

    const supplementalStreams = [];

    if (!videoTrack) {
      const videoStream = await requestUserMedia({ video: true, audio: false });
      if (videoStream) {
        supplementalStreams.push(videoStream);
        videoTrack = getLiveTrackByKind(videoStream, "video");
      }
    }

    if (!audioTrack) {
      const audioStream = await requestUserMedia({ video: false, audio: true });
      if (audioStream) {
        supplementalStreams.push(audioStream);
        audioTrack = getLiveTrackByKind(audioStream, "audio");
      }
    }

    if (supplementalStreams.length > 0) {
      nextStream = mergeMediaStreams(nextStream, ...supplementalStreams);
    }

    if (nextStream?.getTracks?.().length) {
      const nextAudioTrack = getLiveTrackByKind(nextStream, "audio");
      const nextVideoTrack = getLiveTrackByKind(nextStream, "video");

      if (required && !nextVideoTrack) {
        stopMediaStream(nextStream);
        localStreamRef.current = null;
        setLocalStream(null);
        setLocalPreviewTrack(null);
        setIsCameraOff(true);
        const videoTrackError = new Error(MEDIA_CAMERA_REQUIRED_MESSAGE);
        videoTrackError.name = "VideoTrackMissingError";
        throw videoTrackError;
      }

      if (required && !nextAudioTrack) {
        stopMediaStream(nextStream);
        localStreamRef.current = null;
        setLocalStream(null);
        setLocalPreviewTrack(null);
        setIsMuted(true);
        const audioTrackError = new Error(MEDIA_MIC_REQUIRED_MESSAGE);
        audioTrackError.name = "AudioTrackMissingError";
        throw audioTrackError;
      }

      localStreamRef.current = nextStream;
      setLocalStream(nextStream);
      setLocalPreviewTrack(
        getLiveTrackByKind(screenStreamRef.current, "video") || nextVideoTrack
      );
      setIsMuted(!nextAudioTrack);
      setIsCameraOff(!nextVideoTrack);
      return nextStream;
    }

    if (required) {
      throw lastError || new Error("Unable to access camera or microphone.");
    }

    return null;
  }, [setLocalPreviewTrack, stopMediaStream]);

  const preparePeerConnectionMedia = useCallback(
    async (pc) => {
      const stream = localStreamRef.current || (await ensureLocalMedia({ required: false }));
      const liveTracks = stream?.getTracks?.().filter((track) => track.readyState === "live") || [];
      const trackByKind = new Map(liveTracks.map((track) => [track.kind, track]));

      for (const kind of ["audio", "video"]) {
        const nextTrack = trackByKind.get(kind) || null;
        let transceiver = getMediaTransceiver(pc, kind, { createIfMissing: false });

        if (!transceiver) {
          transceiver = nextTrack
            ? pc.addTransceiver(nextTrack, {
                direction: "sendrecv",
                streams: stream ? [stream] : [],
              })
            : pc.addTransceiver(kind, { direction: "sendrecv" });

          mediaTransceiversRef.current[kind] = transceiver;
          continue;
        }

        const currentTrack = transceiver.sender?.track || null;

        if (currentTrack?.id !== nextTrack?.id) {
          await transceiver.sender.replaceTrack(nextTrack);
        }

        transceiver.direction = "sendrecv";
      }

      return stream;
    },
    [ensureLocalMedia, getMediaTransceiver]
  );

  const flushPendingIceCandidates = useCallback(async () => {
    const pc = peerConnectionRef.current;
    if (!pc?.remoteDescription) return;

    for (const candidate of pendingIceCandidatesRef.current) {
      try {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (err) {
        console.error("Failed to add queued ICE candidate:", err);
      }
    }

    pendingIceCandidatesRef.current = [];
  }, []);

  const joinCallRoom = useCallback(
    (roomId) =>
      new Promise((resolve, reject) => {
        if (!socketRef.current) {
          reject(new Error("Socket not connected."));
          return;
        }

        socketRef.current.emit(
          "join_call_room",
          { roomId, userId: user?._id },
          (response) => {
            if (response?.ok === false) {
              reject(new Error(response.message || "Failed to join call room."));
              return;
            }

            resolve(response || { ok: true, participantCount: 1 });
          }
        );
      }),
    [user?._id]
  );

  const sendRoomOffer = useCallback(async (roomId, { syncLocalMedia = true } = {}) => {
    const pc = peerConnectionRef.current || createPeerConnection(roomId);
    if (syncLocalMedia) {
      await preparePeerConnectionMedia(pc);
    }

    if (pc.signalingState !== "stable") return;

    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);

    socketRef.current?.emit("video_call_offer", {
      roomId,
      offer,
    });

    applyCallState((prev) => {
      if (prev.roomId !== roomId || prev.status === "connected") {
        return prev;
      }

      return { ...prev, status: "connecting" };
    });
  }, [applyCallState, createPeerConnection, preparePeerConnectionMedia]);

  // Initialize socket
  useEffect(() => {
    socketRef.current = io(SOCKET_URL, { transports: ["websocket"] });

    socketRef.current.on("connect", () => {
      if (user?._id) {
        socketRef.current?.emit("join_user", user._id);
      }

      const currentConversationId = activeConvRef.current?.conversationId;
      if (currentConversationId) {
        socketRef.current?.emit("join_conversation", currentConversationId);
      }

      const currentCall = callStateRef.current;
      if (currentCall?.roomId) {
        socketRef.current?.emit("join_call_room", {
          roomId: currentCall.roomId,
          userId: user?._id,
        });
      }
    });

    socketRef.current.on("receive_message", (data) => {
      const currentConv = activeConvRef.current;
      if (currentConv && data.conversationId === currentConv.conversationId) {
        const currentUserId = user?._id?.toString();
        const msgSenderId = (data.senderId || data.sender?._id || data.sender)?.toString();
        const isSentByMe = currentUserId === msgSenderId;

        if (isSentByMe) return;

        const nextTimestamp = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

        if (data.type === "video_call" && data.videoCall) {
          upsertChatMessage(
            buildVideoCallMessage({
              id: data.messageId || data.videoCall.id || data.videoCall._id || Date.now(),
              isSent: false,
              senderAvatar: currentConv?.avatar || "??",
              text: data.text,
              timestamp: nextTimestamp,
              call: data.videoCall,
            })
          );
          return;
        }

        setMessages((prev) => [
          ...prev,
          {
            id: data.messageId || Date.now(),
            type: data.type || "text",
            isSent: false,
            senderInitials: currentConv?.avatar || "??",
            text: data.text,
            timestamp: nextTimestamp,
            mediaUrl: data.mediaUrl,
            ...(data.negotiation && {
              negType: data.negotiation.type,
              crop: data.negotiation.crop,
              quantity: data.negotiation.quantity,
              offerPrice: data.negotiation.offerPrice,
              marketPrice: data.negotiation.marketPrice || 58,
              unit: data.negotiation.unit,
            }),
          },
        ]);
      }
    });

    socketRef.current.on("offer_accepted", (data) => {
      setMessages((prev) =>
        prev.map((m) => {
          if (m.negotiationMongoId === data.negotiationMongoId || m.id === data.msgId) {
             return { ...m, negType: "accepted" };
          }
           return m;
        })
      );
      const isSentByMe = data.senderId === user?._id?.toString();
      if (!isSentByMe) {
        setMessages((prev) => [...prev, {
          id: Date.now() + Math.random(), type: "status",
          text: "🎉 Deal confirmed! Both parties agreed on this price.", dealClosed: true,
        }]);
      }
    });

    socketRef.current.on("offer_rejected", (data) => {
      setMessages((prev) =>
        prev.map((m) => {
          if (m.negotiationMongoId === data.negotiationMongoId || m.id === data.msgId) {
             return { ...m, negType: "rejected" };
          }
           return m;
        })
      );
      const isSentByMe = data.senderId === user?._id?.toString();
      if (!isSentByMe) {
          setMessages((prev) => [...prev, {
            id: Date.now() + Math.random(), type: "status",
            text: "Offer was declined. You can send a counter offer or start fresh.",
          }]);
      }
    });

    socketRef.current.on("new_notification", (data) => {
      // Refresh sidebar list (handled by ChatSidebar polling but we could trigger it manually)
      console.log("New message notification:", data);
    });

    socketRef.current.on("video_call_participant_joined", async (data) => {
      const currentCall = callStateRef.current;
      if (!currentCall?.roomId || data?.roomId !== currentCall.roomId) return;

      try {
        if (currentCall.isHost) {
          await sendRoomOffer(data.roomId);
        } else {
          applyCallState((prev) =>
            prev.roomId === data.roomId ? { ...prev, status: "connecting" } : prev
          );
        }
      } catch (err) {
        console.error("Failed to create room offer:", err);
        applyCallState((prev) =>
          prev.roomId === data.roomId ? { ...prev, status: "error" } : prev
        );
      }
    });

    socketRef.current.on("video_call_offer", async (data) => {
      const currentCall = callStateRef.current;
      if (!currentCall?.roomId || data?.roomId !== currentCall.roomId) return;

      try {
        const pc = peerConnectionRef.current || createPeerConnection(data.roomId);
        const incomingOffer = new RTCSessionDescription(data.offer);

        if (pc.signalingState !== "stable") {
          console.warn("Ignoring renegotiation offer in non-stable state:", pc.signalingState);
          return;
        }

        await pc.setRemoteDescription(incomingOffer);
        await preparePeerConnectionMedia(pc);
        await flushPendingIceCandidates();

        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);

        socketRef.current?.emit("video_call_answer", {
          roomId: data.roomId,
          answer,
        });

        applyCallState((prev) =>
          prev.roomId === data.roomId ? { ...prev, status: "connecting" } : prev
        );
      } catch (err) {
        console.error("Failed to handle room offer:", err);
        applyCallState((prev) =>
          prev.roomId === data.roomId ? { ...prev, status: "error" } : prev
        );
      }
    });

    socketRef.current.on("video_call_answer", async (data) => {
      const currentCall = callStateRef.current;
      if (!currentCall?.roomId || data?.roomId !== currentCall.roomId) return;

      try {
        if (!peerConnectionRef.current) return;
        await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(data.answer));
        await flushPendingIceCandidates();
      } catch (err) {
        console.error("Failed to apply room answer:", err);
        applyCallState((prev) =>
          prev.roomId === data.roomId ? { ...prev, status: "error" } : prev
        );
      }
    });

    socketRef.current.on("video_call_ice_candidate", async (data) => {
      const currentCall = callStateRef.current;
      if (!currentCall?.roomId || data?.roomId !== currentCall.roomId) return;

      try {
        if (!peerConnectionRef.current?.remoteDescription) {
          pendingIceCandidatesRef.current.push(data.candidate);
          return;
        }

        await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(data.candidate));
      } catch (err) {
        console.error("Failed to add ICE candidate:", err);
      }
    });

    socketRef.current.on("video_call_ended", (data) => {
      const currentCall = callStateRef.current;
      if (!currentCall?.roomId || (data?.roomId && data.roomId !== currentCall.roomId)) return;
      updateCallMessageState(currentCall.callId, {
        callStatus: "Completed",
        callCanJoin: false,
      });
      finishCallRef.current?.("completed", false);
    });

    return () => socketRef.current?.disconnect();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?._id]);

  // Handle incoming chat request from Map
  useEffect(() => {
    if (location.state?.startChatWith) {
      const item = location.state.startChatWith;
      const initials = item.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
      const tempConv = {
        id: `map-${item.id || Date.now()}`,
        userId: item.userId,
        name: item.name,
        avatar: initials,
        lastMsg: `Interested in ${item.crop}`,
        time: "Just now",
        unread: 0,
        online: true,
        role: item.type || "farmer",
        crop: item.crop,
      };

      setExtraConvs((prev) => {
        // Avoid duplicates
        if (prev.find((c) => c.name === item.name)) return prev;
        return [tempConv, ...prev];
      });

      setActiveConv(tempConv);
      setMessages([
        { id: 1, type: "date", text: "Today" },
        {
          id: 2, type: "text", isSent: false,
          senderInitials: initials,
          text: `নমস্কার! আমি ${item.name}। আপনি কি ${item.crop} নিয়ে আলোচনা করতে চান?`,
          timestamp: "Just now",
        },
      ]);

      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => () => resetCallResources(), [resetCallResources]);

  useEffect(() => {
    if (callState.status === "connected") {
      setCallDuration(0);
      callTimerRef.current = setInterval(() => setCallDuration((d) => d + 1), 1000);
    } else {
      clearInterval(callTimerRef.current);
    }
    return () => clearInterval(callTimerRef.current);
  }, [callState.status]);

  const handleStartVideoCall = useCallback(async () => {
    if (
      !token ||
      !activeConv?.userId ||
      !user?._id ||
      callState.isOpen ||
      callState.status === "connecting" ||
      callState.status === "connected"
    ) {
      return;
    }

    try {
      await ensureLocalMedia({ required: true });
      setCallErrorMessage("");

      const res = await fetch(`${API_BASE}/api/messages/calls/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-auth-token": token },
        body: JSON.stringify({
          receiverId: activeConv.userId,
          conversationId: activeConv.conversationId,
          purpose: "Negotiation",
        }),
      });

      const payload = await res.json();
      if (!res.ok) {
        throw new Error(payload.message || "Failed to start video call.");
      }

      const call = payload.call;
      const inviteMessage = payload.inviteMessage;
      const resolvedConversationId = call.conversationId || activeConv?.conversationId || activeConv?.id;
      const isCallCreator = getEntityId(call.createdBy) === user?._id?.toString();

      if (resolvedConversationId) {
        if (activeConv?.id?.startsWith("map-")) {
          const updatedConv = {
            ...activeConv,
            id: resolvedConversationId,
            conversationId: resolvedConversationId,
          };
          setActiveConv(updatedConv);
          setExtraConvs((prev) => prev.map((conv) => (conv.id === activeConv.id ? updatedConv : conv)));
        } else if (!activeConv?.conversationId) {
          setActiveConv((prev) => (prev ? { ...prev, conversationId: resolvedConversationId } : prev));
        }

        socketRef.current?.emit("join_conversation", resolvedConversationId);
      }

      if (inviteMessage?.videoCallId) {
        upsertChatMessage(
          buildVideoCallMessage({
            id: inviteMessage._id,
            isSent: true,
            senderAvatar: senderInitials,
            text: inviteMessage.text,
            timestamp: new Date(inviteMessage.createdAt || Date.now()).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            }),
            call: inviteMessage.videoCallId,
          })
        );

        socketRef.current?.emit("send_message", {
          messageId: inviteMessage._id,
          conversationId: resolvedConversationId,
          senderId: user?._id,
          receiverId: activeConv.userId,
          type: "video_call",
          text: inviteMessage.text,
          videoCall: inviteMessage.videoCallId,
        });
      }

      applyCallState({
        isOpen: true,
        status: "waiting",
        callId: call.id,
        roomId: call.roomId,
        conversationId: call.conversationId,
        isHost: isCallCreator,
      });

      const roomJoin = await joinCallRoom(call.roomId);
      const isHost =
        isCallCreator ||
        Number(roomJoin?.participantCount || 1) <= 1;

      applyCallState({
        isOpen: true,
        status: isHost ? "waiting" : "connecting",
        callId: call.id,
        roomId: call.roomId,
        conversationId: call.conversationId,
        isHost,
      });

      // If the callee already joined before our state update landed, send the
      // initial offer immediately instead of waiting for another room event.
      if (isHost && Number(roomJoin?.participantCount || 0) > 1) {
        await sendRoomOffer(call.roomId);
      }
    } catch (err) {
      console.error("Failed to start video call:", err);
      setCallErrorMessage(getMediaAccessErrorMessage(err));
      resetCallResources();
      applyCallState({
        isOpen: true,
        status: "error",
        callId: null,
        roomId: null,
        conversationId: activeConv?.conversationId || null,
        isHost: false,
      });
      setTimeout(() => {
        applyCallState({
          isOpen: false,
          status: "idle",
          callId: null,
          roomId: null,
          conversationId: null,
          isHost: false,
        });
      }, 1800);
    }
  }, [
    activeConv,
    buildVideoCallMessage,
    callState.isOpen,
    callState.status,
    ensureLocalMedia,
    joinCallRoom,
    resetCallResources,
    senderInitials,
    sendRoomOffer,
    token,
    upsertChatMessage,
    applyCallState,
    user,
  ]);

  const handleJoinVideoCall = useCallback(async (message) => {
    if (!token || !message?.callId || callState.isOpen) {
      return;
    }

    setJoiningCallId(message.callId);

    try {
      await ensureLocalMedia({ required: true });
      setCallErrorMessage("");

      const res = await fetch(`${API_BASE}/api/messages/calls/${message.callId}/answer`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-auth-token": token },
      });

      const payload = await res.json();
      if (!res.ok) {
        throw new Error(payload.message || "Failed to join video call.");
      }

      const call = payload.call;

      if (call.conversationId) {
        socketRef.current?.emit("join_conversation", call.conversationId);
      }

      updateCallMessageState(call.id, {
        ...getVideoCallMessageMeta({
          call,
          currentUserId: user?._id?.toString() || "",
          isSent: false,
        }),
      });

      applyCallState({
        isOpen: true,
        status: "connecting",
        callId: call.id,
        roomId: call.roomId,
        conversationId: call.conversationId,
        isHost: false,
      });

      const roomJoin = await joinCallRoom(call.roomId);
      applyCallState((prev) =>
        prev.callId === call.id
          ? {
              ...prev,
              status: Number(roomJoin?.participantCount || 0) > 1 ? "connecting" : "waiting",
            }
          : prev
      );
    } catch (err) {
      console.error("Failed to join video call:", err);
      setMessages((prev) => [
        ...prev,
        {
          id: `call-error-${Date.now()}`,
          type: "status",
          text: getMediaAccessErrorMessage(err),
        },
      ]);
    } finally {
      setJoiningCallId(null);
    }
  }, [callState.isOpen, ensureLocalMedia, joinCallRoom, token, updateCallMessageState, applyCallState, user?._id]);

  const finishCall = useCallback(async (reason = "completed", notifyPeer = true) => {
    const currentCallId = callState.callId;
    const currentRoomId = callState.roomId;
    const nextCallStatus =
      reason === "declined" ? "Cancelled" : reason === "missed" ? "Missed" : "Completed";

    if (notifyPeer && currentRoomId) {
      socketRef.current?.emit("video_call_ended", {
        callId: currentCallId,
        roomId: currentRoomId,
      });
    }

    if (currentRoomId) {
      socketRef.current?.emit("leave_call_room", {
        roomId: currentRoomId,
        userId: user?._id,
      });
    }

    if (token && currentCallId) {
      try {
        await fetch(`${API_BASE}/api/messages/calls/${currentCallId}/end`, {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-auth-token": token },
          body: JSON.stringify({ reason }),
        });
      } catch (err) {
        console.error("Failed to update call status:", err);
      }
    }

    updateCallMessageState(currentCallId, {
      callStatus: nextCallStatus,
      callCanJoin: false,
    });
    setJoiningCallId(null);
    setCallErrorMessage("");
    resetCallResources();
    applyCallState({
      isOpen: false,
      status: "idle",
      callId: null,
      roomId: null,
      conversationId: null,
      isHost: false,
    });
  }, [callState.callId, callState.roomId, resetCallResources, token, updateCallMessageState, applyCallState, user?._id]);

  useEffect(() => {
    finishCallRef.current = finishCall;
  }, [finishCall]);

  useEffect(() => {
    if (callState.status !== "waiting") return;
    const timer = setTimeout(() => finishCallRef.current?.("missed", true), 30000);
    return () => clearTimeout(timer);
  }, [callState.status]);

  const handleEndVideoCall = useCallback(async () => {
    applyCallState((prev) => ({ ...prev, status: "ending" }));
    await finishCall("completed", true);
  }, [finishCall, applyCallState]);

  const handleToggleMute = useCallback(() => {
    if (!localStream) return;
    const nextMuted = !isMuted;
    localStream.getAudioTracks().forEach((track) => {
      track.enabled = !nextMuted;
    });
    setIsMuted(nextMuted);
  }, [isMuted, localStream]);

  const handleToggleCamera = useCallback(() => {
    if (!localStream) return;
    const nextCameraOff = !isCameraOff;
    localStream.getVideoTracks().forEach((track) => {
      track.enabled = !nextCameraOff;
    });
    if (!isScreenSharing) {
      setLocalPreviewTrack(nextCameraOff ? null : getLiveTrackByKind(localStream, "video"));
    }
    setIsCameraOff(nextCameraOff);
  }, [isCameraOff, isScreenSharing, localStream, setLocalPreviewTrack]);

  const handleToggleScreenShare = useCallback(async () => {
    if (!peerConnectionRef.current || callState.status !== "connected") return;

    const videoTransceiver = getMediaTransceiver(peerConnectionRef.current, "video");
    const videoSender = videoTransceiver?.sender;
    if (!videoSender) return;

    if (isScreenSharing) {
      screenStreamRef.current?.getTracks().forEach((t) => t.stop());
      screenStreamRef.current = null;
      const camTrack = localStreamRef.current?.getVideoTracks()[0];
      const restoredTrack = cameraOffRef.current ? null : camTrack || null;
      await videoSender.replaceTrack(restoredTrack);
      setLocalPreviewTrack(restoredTrack);
      await sendRoomOffer(callStateRef.current.roomId, { syncLocalMedia: false });
      setIsScreenSharing(false);
    } else {
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: false });
        screenStreamRef.current = screenStream;
        const screenTrack = screenStream.getVideoTracks()[0];
        if (screenTrack) {
          screenTrack.contentHint = "detail";
        }
        await videoSender.replaceTrack(screenTrack);
        setLocalPreviewTrack(screenTrack);
        await sendRoomOffer(callStateRef.current.roomId, { syncLocalMedia: false });
        screenTrack.onended = () => {
          screenStreamRef.current = null;
          const camTrack2 = localStreamRef.current?.getVideoTracks()[0];
          const restoredTrack = cameraOffRef.current ? null : camTrack2 || null;
          const activeVideoSender = getMediaTransceiver(peerConnectionRef.current, "video")?.sender;
          if (activeVideoSender) {
            activeVideoSender.replaceTrack(restoredTrack);
          }
          setLocalPreviewTrack(restoredTrack);
          if (callStateRef.current?.roomId) {
            sendRoomOffer(callStateRef.current.roomId, { syncLocalMedia: false }).catch((error) => {
              console.error("Failed to renegotiate after screen share ended:", error);
            });
          }
          setIsScreenSharing(false);
        };
        setIsScreenSharing(true);
      } catch (err) {
        console.error("Screen share failed:", err);
        setCallErrorMessage(getMediaAccessErrorMessage(err));
      }
    }
  }, [callState.status, getMediaTransceiver, isScreenSharing, sendRoomOffer, setLocalPreviewTrack]);

  // Load messages from backend when switching convos
  const loadBackendMessages = useCallback(async (convId) => {
    if (!token || typeof convId !== "string" || convId.startsWith("map-")) return;
    try {
      setLoadingMessages(true);
      const res = await fetch(`${API_BASE}/api/messages/${convId}`, {
        headers: { "x-auth-token": token },
      });
      if (!res.ok) return;
      const data = await res.json();
      if (data.length > 0) {
        setMessages(
          data.map((m) => {
            const senderIdStr = (m.sender?._id || m.sender).toString();
            const isSentByMe = senderIdStr === user?._id?.toString();

            if (m.type === "video_call" && m.videoCallId) {
              return buildVideoCallMessage({
                id: m._id,
                isSent: isSentByMe,
                senderAvatar: isSentByMe
                  ? senderInitials
                  : (m.sender?.fullName?.slice(0, 2).toUpperCase() || "??"),
                text: m.text || "",
                timestamp: new Date(m.createdAt).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                }),
                call: m.videoCallId,
              });
            }

            return {
              id: m._id,
              type: m.type,
              isSent: isSentByMe,
              senderInitials: isSentByMe ? senderInitials : (m.sender?.fullName?.slice(0, 2).toUpperCase() || "??"),
              text: m.text || "",
              timestamp: new Date(m.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
              mediaUrl: m.mediaUrl,
              ...(m.negotiationId && {
                negType: m.negotiationId.status !== "Pending" ? m.negotiationId.status.toLowerCase() : m.negotiationId.type,
                crop: m.negotiationId.crop,
                quantity: m.negotiationId.quantity,
                offerPrice: m.negotiationId.offerPrice,
                marketPrice: m.negotiationId.marketPrice || 58,
                unit: m.negotiationId.unit,
                negotiationMongoId: m.negotiationId._id,
              }),
            };
          })
        );
      }
    } catch (e) {
      console.error("Failed to load messages:", e);
    } finally {
      setLoadingMessages(false);
    }
  }, [buildVideoCallMessage, token, user, senderInitials]);

  const handleSelectConv = (conv) => {
    setActiveConv(conv);
    setSidebarOpen(false);
    setIsOfferMode(false);

    // Use backend for real ones, or fallback for guest map navigation
    if (conv.conversationId) {
      loadBackendMessages(conv.conversationId);
    } else {
      // For temporary chats initiated from Map that haven't sent a message yet
      setMessages([
        { id: 1, type: "date", text: "Today" },
        {
          id: 2, type: "text", isSent: false,
          senderInitials: conv.avatar || "??",
          text: conv.lastMsg || "Hello! I'm interested in discussing a trade.",
          timestamp: "Just now",
        },
      ]);
    }

    // Join socket room
    if (conv.conversationId) {
      socketRef.current?.emit("join_conversation", conv.conversationId);
    }
  };

  const simulateTyping = () => {
    setIsTyping(true);
    setTimeout(() => setIsTyping(false), 2200);
  };

  const handleSendMessage = async (text, file) => {
    const msg = {
      id: Date.now(),
      type: file ? (file.type.startsWith("image") ? "image" : file.type.startsWith("audio") ? "audio" : "file") : "text",
      isSent: true,
      senderInitials: senderInitials,
      text,
      mediaUrl: file ? URL.createObjectURL(file) : null, // Local preview
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, msg]);
    simulateTyping();

    // Send to backend if logged in and conv has a real receiver
    if (token && activeConv?.userId) {
      try {
        const formData = new FormData();
        formData.append("receiverId", activeConv.userId);
        if (text) formData.append("text", text);
        if (file) formData.append("media", file);

        const res = await fetch(`${API_BASE}/api/messages`, {
          method: "POST",
          headers: { "x-auth-token": token },
          body: formData,
        });

        if (res.ok) {
          const { message, conversationId } = await res.json();
          if (conversationId) {
            if (activeConv.id.startsWith("map-")) {
              const updatedConv = { ...activeConv, id: conversationId, conversationId };
              setActiveConv(updatedConv);
              setExtraConvs(prev => prev.map(c => c.id === activeConv.id ? updatedConv : c));
            }
            socketRef.current?.emit("join_conversation", conversationId);
            socketRef.current?.emit("send_message", {
              conversationId,
              senderId: user?._id,
              receiverId: activeConv.userId,
              text: message.text,
              type: message.type,
              mediaUrl: message.mediaUrl,
            });
          }
        }
      } catch (e) {
        console.error("Failed to send message:", e);
      }
    }
  };

  const handleSendOffer = async (offerData) => {
    const msg = {
      id: Date.now(), type: "negotiation", isSent: true, senderInitials: senderInitials,
      negType: "offer", crop: offerData.crop,
      quantity: offerData.quantity || "—",
      offerPrice: Number(offerData.price),
      marketPrice: getMockLivePrice(offerData.crop), unit: offerData.unit,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };
    setMessages((prev) => [...prev, msg]);
    setIsOfferMode(false);
    simulateTyping();

    // Send to backend if logged in
    if (token && activeConv?.userId) {
      try {
        const res = await fetch(`${API_BASE}/api/messages/offer`, {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-auth-token": token },
          body: JSON.stringify({
            receiverId: activeConv.userId,
            crop: offerData.crop,
            quantity: offerData.quantity,
            offerPrice: Number(offerData.price),
            marketPrice: getMockLivePrice(offerData.crop), 
            unit: offerData.unit,
            note: offerData.note,
            type: "offer",
          }),
        });

        if (res.ok) {
          const { message, conversationId } = await res.json();
          if (conversationId) {
            if (activeConv.id.startsWith("map-")) {
              const updatedConv = { ...activeConv, id: conversationId, conversationId };
              setActiveConv(updatedConv);
              setExtraConvs(prev => prev.map(c => c.id === activeConv.id ? updatedConv : c));
            }
            socketRef.current?.emit("join_conversation", conversationId);
            socketRef.current?.emit("send_message", {
              conversationId,
              senderId: user?._id,
              receiverId: activeConv.userId,
              type: "negotiation",
              negotiation: {
                ...message.negotiationId,
                marketPrice: message.negotiationId?.marketPrice || getMockLivePrice(offerData.crop)
              },
            });
          }
        }
      } catch (e) {
        console.error("Failed to send offer:", e);
      }
    }
  };

  const handleAcceptOffer = async (msgId) => {
    setMessages((prev) =>
      prev.map((m) => (m.id === msgId && m.type === "negotiation" ? { ...m, negType: "accepted" } : m))
    );
    const statusMsg = {
      id: Date.now(), type: "status",
      text: "🎉 Deal confirmed! Both parties agreed on this price.", dealClosed: true,
    };
    setMessages((prev) => [...prev, statusMsg]);

    // Update backend
    const origMsg = messages.find((m) => m.id === msgId);
    if (token && origMsg?.negotiationMongoId) {
      try {
        await fetch(`${API_BASE}/api/messages/offer/${origMsg.negotiationMongoId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json", "x-auth-token": token },
          body: JSON.stringify({ action: "accept" }),
        });
        socketRef.current?.emit("accept_offer", {
           conversationId: activeConv.conversationId || activeConv.id,
           msgId,
           negotiationMongoId: origMsg.negotiationMongoId,
           senderId: user?._id?.toString()
        });
      } catch (e) {
        console.error("Failed to update offer:", e);
      }
    }
  };

  const handleRejectOffer = async (msgId) => {
    setMessages((prev) =>
      prev.map((m) => (m.id === msgId && m.type === "negotiation" ? { ...m, negType: "rejected" } : m))
    );
    const statusMsg = {
      id: Date.now(), type: "status",
      text: "Offer was declined. You can send a counter offer or start fresh.",
    };
    setMessages((prev) => [...prev, statusMsg]);

    const origMsg = messages.find((m) => m.id === msgId);
    if (token && origMsg?.negotiationMongoId) {
      try {
        await fetch(`${API_BASE}/api/messages/offer/${origMsg.negotiationMongoId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json", "x-auth-token": token },
          body: JSON.stringify({ action: "reject" }),
        });
        socketRef.current?.emit("reject_offer", {
           conversationId: activeConv.conversationId || activeConv.id,
           msgId,
           negotiationMongoId: origMsg.negotiationMongoId,
           senderId: user?._id?.toString()
        });
      } catch (e) {
        console.error("Failed to reject offer:", e);
      }
    }
  };

  const handleCounterOffer = (msgId) => {
    const originalMsg = messages.find((m) => m.id === msgId);
    setCounterFor(originalMsg);
    setModalOpen(true);
  };

  const handleModalSubmit = async (data) => {
    const msg = {
      id: Date.now(), type: "negotiation", isSent: true, senderInitials: senderInitials,
      negType: "counter", crop: data.crop,
      quantity: data.quantity || counterFor?.quantity || "—",
      offerPrice: Number(data.price),
      marketPrice: getMockLivePrice(data.crop),
      unit: data.unit,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };
    setMessages((prev) => [...prev, msg]);
    setCounterFor(null);
    setModalOpen(false);
    simulateTyping();

    // Send to backend
    if (token && activeConv?.userId) {
      try {
        const res = await fetch(`${API_BASE}/api/messages/offer`, {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-auth-token": token },
          body: JSON.stringify({
            receiverId: activeConv.userId,
            crop: data.crop,
            quantity: data.quantity || counterFor?.quantity,
            offerPrice: Number(data.price),
            marketPrice: getMockLivePrice(data.crop),
            unit: data.unit,
            note: data.note,
            type: "counter",
          }),
        });

        if (res.ok) {
          const { message, conversationId } = await res.json();
          if (conversationId) {
            if (activeConv.id.startsWith("map-")) {
              const updatedConv = { ...activeConv, id: conversationId, conversationId };
              setActiveConv(updatedConv);
              setExtraConvs(prev => prev.map(c => c.id === activeConv.id ? updatedConv : c));
            }
            socketRef.current?.emit("join_conversation", conversationId);
            socketRef.current?.emit("send_message", {
              conversationId,
              senderId: user?._id,
              receiverId: activeConv.userId,
              type: "negotiation",
              negotiation: {
                ...message.negotiationId,
                marketPrice: message.negotiationId?.marketPrice || getMockLivePrice(data.crop)
              },
            });
          }
        }
      } catch (e) {
        console.error("Failed to send counter offer:", e);
      }
    }
  };

  return (
    <div className="cn-page">
      {/* Live Market Price Ticker */}
      <LivePriceTicker />

      {/* Page Title Bar */}
      <div className="cn-page-header">
        <div className="cn-page-header__title">
          <h1>💬 Chat &amp; Price Negotiation</h1>
          <span>AgriNetwork Bangladesh — Direct Farmer-Vendor Deals</span>
        </div>
        <div className="cn-page-header__badges">
          <span className="cn-badge cn-badge--active">🟢 Direct Trading Channel</span>
        </div>
      </div>

      {/* Main layout */}
      <div className={`cn-layout${activeConv ? " cn-layout--conv-open" : ""}`}>
        {sidebarOpen && (
          <div style={{ position: "fixed", inset: 0, background: "rgba(52,78,65,0.3)", zIndex: 40 }}
            onClick={() => setSidebarOpen(false)} aria-hidden="true" />
        )}

        <ChatSidebar
          activeId={activeConv?.id}
          onSelect={handleSelectConv}
          isOpen={sidebarOpen}
          extraConversations={extraConvs}
        />

        {/* Chat Area */}
        <div className="cn-chat">
          {activeConv ? (
            <>
              <ChatHeader
                conversation={activeConv}
                activeStep={2}
                onToggleSidebar={() => setSidebarOpen((v) => !v)}
                onStartVideoCall={handleStartVideoCall}
                videoCallDisabled={!activeConv?.userId || callState.isOpen}
              />

              <div className="cn-messages" role="log" aria-live="polite">
                {loadingMessages ? (
                  <div style={{ textAlign: "center", padding: "2rem", color: "#888" }}>Loading messages…</div>
                ) : (
                  messages.map((msg) => (
                    <MessageBubble
                      key={msg.id}
                      message={msg}
                      onAcceptOffer={handleAcceptOffer}
                      onRejectOffer={handleRejectOffer}
                      onCounterOffer={handleCounterOffer}
                      onJoinVideoCall={handleJoinVideoCall}
                      joiningCallId={joiningCallId}
                      activeCallId={callState.callId}
                    />
                  ))
                )}

                {isTyping && (
                  <div className="cn-msg-row received">
                    <div className="cn-msg-avatar">{activeConv.avatar}</div>
                    <div className="cn-typing">
                      <div className="cn-typing-dots"><span /><span /><span /></div>
                      {activeConv.name} is typing…
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              <PriceInputPanel
                onSendMessage={handleSendMessage}
                onSendOffer={handleSendOffer}
                isOfferMode={isOfferMode}
                setIsOfferMode={setIsOfferMode}
              />
            </>
          ) : (
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

      <VideoCallModal
        isOpen={callState.isOpen}
        status={callState.status}
        conversation={activeConv}
        localStream={isScreenSharing ? screenStreamRef.current : localStream}
        remoteStream={remoteStream}
        isMuted={isMuted}
        isCameraOff={isCameraOff}
        isScreenSharing={isScreenSharing}
        callDuration={callDuration}
        iceState={iceState}
        errorMessage={callErrorMessage}
        onEnd={handleEndVideoCall}
        onToggleMute={handleToggleMute}
        onToggleCamera={handleToggleCamera}
        onToggleScreenShare={handleToggleScreenShare}
      />
    </div>
  );
}

export default ChatNegotiationPage;
