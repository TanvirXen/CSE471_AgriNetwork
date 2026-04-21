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

const API_BASE = import.meta.env.VITE_API_URL || "";
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || import.meta.env.VITE_API_URL || "";
const ICE_SERVERS = [{ urls: "stun:stun.l.google.com:19302" }];

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
  const messagesEndRef = useRef(null);
  const socketRef = useRef(null);
  const peerConnectionRef = useRef(null);
  const pendingIceCandidatesRef = useRef([]);
  const localStreamRef = useRef(null);
  const remoteStreamRef = useRef(null);
  const activeConvRef = useRef(null);
  const callStateRef = useRef(callState);
  const screenStreamRef = useRef(null);
  const callTimerRef = useRef(null);
  const finishCallRef = useRef(null);

  useEffect(() => {
    localStreamRef.current = localStream;
  }, [localStream]);

  useEffect(() => {
    remoteStreamRef.current = remoteStream;
  }, [remoteStream]);

  useEffect(() => {
    activeConvRef.current = activeConv;
  }, [activeConv]);

  useEffect(() => {
    callStateRef.current = callState;
  }, [callState]);

  const stopMediaStream = useCallback((stream) => {
    stream?.getTracks?.().forEach((track) => track.stop());
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
    screenStreamRef.current?.getTracks().forEach((t) => t.stop());
    screenStreamRef.current = null;
    setLocalStream(null);
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

    const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
    const incomingRemoteStream = new MediaStream();
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
      event.streams[0]?.getTracks().forEach((track) => incomingRemoteStream.addTrack(track));
      setCallState((prev) => ({ ...prev, status: "connected" }));
    };

    pc.oniceconnectionstatechange = () => {
      setIceState(pc.iceConnectionState);
      if (pc.iceConnectionState === "failed") {
        setCallState((prev) => ({ ...prev, status: "error" }));
      }
    };

    peerConnectionRef.current = pc;
    return pc;
  }, []);

  const ensureLocalMedia = useCallback(async () => {
    if (localStreamRef.current) {
      return localStreamRef.current;
    }

    const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    setLocalStream(stream);
    setIsMuted(false);
    setIsCameraOff(false);
    return stream;
  }, []);

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

  const sendRoomOffer = useCallback(async (roomId) => {
    const stream = localStreamRef.current || (await ensureLocalMedia());
    const pc = peerConnectionRef.current || createPeerConnection(roomId);

    if (!pc.getSenders().length) {
      stream.getTracks().forEach((track) => pc.addTrack(track, stream));
    }

    if (pc.localDescription || pc.remoteDescription) return;

    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);

    socketRef.current?.emit("video_call_offer", {
      roomId,
      offer,
    });

    setCallState((prev) =>
      prev.roomId === roomId ? { ...prev, status: "connecting" } : prev
    );
  }, [createPeerConnection, ensureLocalMedia]);

  // Initialize socket
  useEffect(() => {
    socketRef.current = io(SOCKET_URL, { transports: ["websocket"] });

    if (user?._id) {
      socketRef.current.emit("join_user", user._id);
    }

    socketRef.current.on("receive_message", (data) => {
      const currentConv = activeConvRef.current;
      if (currentConv && data.conversationId === currentConv.conversationId) {
        const currentUserId = user?._id?.toString();
        const msgSenderId = (data.senderId || data.sender?._id || data.sender)?.toString();
        const isSentByMe = currentUserId === msgSenderId;

        setMessages((prev) => {
          if (isSentByMe) return prev;
          return [
            ...prev,
            {
              id: Date.now(),
              type: data.type || "text",
              isSent: false,
              senderInitials: currentConv?.avatar || "??",
              text: data.text,
              timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
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
          ];
        });
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
          setCallState((prev) =>
            prev.roomId === data.roomId ? { ...prev, status: "connecting" } : prev
          );
        }
      } catch (err) {
        console.error("Failed to create room offer:", err);
        setCallState((prev) =>
          prev.roomId === data.roomId ? { ...prev, status: "error" } : prev
        );
      }
    });

    socketRef.current.on("video_call_offer", async (data) => {
      const currentCall = callStateRef.current;
      if (!currentCall?.roomId || data?.roomId !== currentCall.roomId) return;

      try {
        const pc = peerConnectionRef.current || createPeerConnection(data.roomId);
        const stream = localStreamRef.current || (await ensureLocalMedia());

        if (!pc.getSenders().length) {
          stream.getTracks().forEach((track) => pc.addTrack(track, stream));
        }

        if (!pc.remoteDescription) {
          await pc.setRemoteDescription(new RTCSessionDescription(data.offer));
          await flushPendingIceCandidates();
        }

        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);

        socketRef.current?.emit("video_call_answer", {
          roomId: data.roomId,
          answer,
        });

        setCallState((prev) =>
          prev.roomId === data.roomId ? { ...prev, status: "connecting" } : prev
        );
      } catch (err) {
        console.error("Failed to handle room offer:", err);
        setCallState((prev) =>
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
        setCallState((prev) =>
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
      finishCallRef.current?.("completed", false);
    });

    return () => socketRef.current?.disconnect();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, createPeerConnection, ensureLocalMedia, flushPendingIceCandidates, resetCallResources, sendRoomOffer]);

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

  const senderInitials = user?.fullName
    ? user.fullName.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : "You";

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

      setCallState({
        isOpen: true,
        status: "waiting",
        callId: call.id,
        roomId: call.roomId,
        conversationId: call.conversationId,
        isHost: false,
      });

      const roomJoin = await joinCallRoom(call.roomId);
      const isHost = Number(roomJoin?.participantCount || 1) <= 1;

      setCallState({
        isOpen: true,
        status: isHost ? "waiting" : "connecting",
        callId: call.id,
        roomId: call.roomId,
        conversationId: call.conversationId,
        isHost,
      });
    } catch (err) {
      console.error("Failed to start video call:", err);
      resetCallResources();
      setCallState({
        isOpen: true,
        status: "error",
        callId: null,
        roomId: null,
        conversationId: activeConv?.conversationId || null,
        isHost: false,
      });
      setTimeout(() => {
        setCallState({
          isOpen: false,
          status: "idle",
          callId: null,
          roomId: null,
          conversationId: null,
          isHost: false,
        });
      }, 1800);
    }
  }, [activeConv, callState.isOpen, callState.status, joinCallRoom, resetCallResources, token, user]);

  const finishCall = useCallback(async (reason = "completed", notifyPeer = true) => {
    const currentCallId = callState.callId;
    const currentRoomId = callState.roomId;

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

    resetCallResources();
    setCallState({
      isOpen: false,
      status: "idle",
      callId: null,
      roomId: null,
      conversationId: null,
      isHost: false,
    });
  }, [callState.callId, callState.roomId, resetCallResources, token, user?._id]);

  useEffect(() => {
    finishCallRef.current = finishCall;
  }, [finishCall]);

  useEffect(() => {
    if (callState.status !== "waiting") return;
    const timer = setTimeout(() => finishCallRef.current?.("missed", true), 30000);
    return () => clearTimeout(timer);
  }, [callState.status]);

  const handleEndVideoCall = useCallback(async () => {
    setCallState((prev) => ({ ...prev, status: "ending" }));
    await finishCall("completed", true);
  }, [finishCall]);

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
    setIsCameraOff(nextCameraOff);
  }, [isCameraOff, localStream]);

  const handleToggleScreenShare = useCallback(async () => {
    if (!peerConnectionRef.current || callState.status !== "connected") return;

    if (isScreenSharing) {
      screenStreamRef.current?.getTracks().forEach((t) => t.stop());
      screenStreamRef.current = null;
      const camTrack = localStreamRef.current?.getVideoTracks()[0];
      if (camTrack) {
        const sender = peerConnectionRef.current.getSenders().find((s) => s.track?.kind === "video");
        if (sender) await sender.replaceTrack(camTrack);
      }
      setIsScreenSharing(false);
    } else {
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: false });
        screenStreamRef.current = screenStream;
        const screenTrack = screenStream.getVideoTracks()[0];
        const sender = peerConnectionRef.current.getSenders().find((s) => s.track?.kind === "video");
        if (sender) await sender.replaceTrack(screenTrack);
        screenTrack.onended = () => {
          screenStreamRef.current = null;
          const camTrack2 = localStreamRef.current?.getVideoTracks()[0];
          if (camTrack2 && peerConnectionRef.current) {
            const s = peerConnectionRef.current.getSenders().find((x) => x.track?.kind === "video");
            if (s) s.replaceTrack(camTrack2);
          }
          setIsScreenSharing(false);
        };
        setIsScreenSharing(true);
      } catch (err) {
        console.error("Screen share failed:", err);
      }
    }
  }, [callState.status, isScreenSharing]);

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
  }, [token, user, senderInitials]);

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
      <div className="cn-layout">
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
        localStream={localStream}
        remoteStream={remoteStream}
        isMuted={isMuted}
        isCameraOff={isCameraOff}
        isScreenSharing={isScreenSharing}
        callDuration={callDuration}
        iceState={iceState}
        onEnd={handleEndVideoCall}
        onToggleMute={handleToggleMute}
        onToggleCamera={handleToggleCamera}
        onToggleScreenShare={handleToggleScreenShare}
      />
    </div>
  );
}

export default ChatNegotiationPage;
