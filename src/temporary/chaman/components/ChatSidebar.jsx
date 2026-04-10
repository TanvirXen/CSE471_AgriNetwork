import { useState, useEffect } from "react";
import { useAuth } from "../../../context/AuthContext";

const API_BASE = import.meta.env.VITE_API_URL || "";

function ChatSidebar({ activeId, onSelect, isOpen, extraConversations = [] }) {
    const { token } = useAuth();
    const [conversations, setConversations] = useState([]);
    const [search, setSearch] = useState("");
    const [activeTab, setActiveTab] = useState("All");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchConversations = async () => {
            if (!token) {
                setLoading(false);
                return;
            }
            try {
                const res = await fetch(`${API_BASE}/api/messages/conversations`, {
                    headers: { "x-auth-token": token },
                });
                if (res.ok) {
                    const data = await res.json();
                    setConversations(data);
                }
            } catch (err) {
                console.error("Failed to fetch conversations:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchConversations();
        // Polling for new messages every 10 seconds
        const interval = setInterval(fetchConversations, 10000);
        return () => clearInterval(interval);
    }, [token]);

    // Merge backend conversations + dynamic ones from map navigation
    const allConvs = [
        ...extraConversations,
        ...conversations.map(c => ({
            id: c.conversationId,
            conversationId: c.conversationId,
            userId: c.otherUser?._id,
            name: c.otherUser?.fullName,
            role: c.otherUser?.role || "user",
            avatar: c.otherUser?.profile?.avatar || c.otherUser?.fullName?.slice(0, 2).toUpperCase(),
            lastMsg: c.lastMessage,
            time: new Date(c.lastTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            unread: c.unread || 0,
            online: true, // Simplified
        })).filter(c => !extraConversations.find(e => e.userId === c.userId))
    ];

    const filtered = allConvs.filter((c) => {
        const matchesSearch =
            !search ||
            c.name?.toLowerCase().includes(search.toLowerCase()) ||
            (c.crop && c.crop.toLowerCase().includes(search.toLowerCase()));

        const matchesTab =
            activeTab === "All" ||
            (activeTab === "Farmers" && (c.role === "farmer" || c.role === "Farmer")) ||
            (activeTab === "Vendors" && (c.role === "vendor" || c.role === "Vendor"));

        return matchesSearch && matchesTab;
    });

    return (
        <aside className={`cn-sidebar${isOpen ? " open" : ""}`}>
            {/* Search */}
            <div className="cn-sidebar__header">
                <div className="cn-sidebar__search">
                    <span className="cn-sidebar__search-icon">🔍</span>
                    <input
                        placeholder="Search for Messages..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
            </div>

            {/* Tab Filter */}
            <div className="cn-sidebar__tabs">
                {["All", "Farmers", "Vendors"].map((tab) => (
                    <button
                        key={tab}
                        className={`cn-sidebar__tab${activeTab === tab ? " active" : ""}`}
                        onClick={() => setActiveTab(tab)}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            {/* Conversation List */}
            <div className="cn-sidebar__list">
                {loading && !allConvs.length ? (
                    <div style={{ padding: "2rem", textAlign: "center", color: "#888" }}>Loading...</div>
                ) : filtered.length === 0 ? (
                    <div style={{ padding: "2rem", textAlign: "center", color: "#888", fontSize: "0.9rem" }}>
                        {token ? "No conversations found" : "Login to see your messages"}
                    </div>
                ) : (
                    filtered.map((conv) => (
                        <div
                            key={conv.id}
                            className={`cn-conv-item${activeId === conv.id ? " active" : ""}`}
                            onClick={() => onSelect(conv)}
                            role="button"
                            tabIndex={0}
                            onKeyDown={(e) => e.key === "Enter" && onSelect(conv)}
                            aria-label={`Chat with ${conv.name}`}
                        >
                            {/* Avatar */}
                            <div className="cn-conv-item__avatar-wrap">
                                <div className="cn-conv-item__avatar">{conv.avatar}</div>
                                {conv.online && <span className="cn-conv-item__online" />}
                            </div>

                            {/* Body */}
                            <div className="cn-conv-item__body">
                                <div className="cn-conv-item__top">
                                    <span className="cn-conv-item__name">{conv.name}</span>
                                    <span className="cn-conv-item__time">{conv.time}</span>
                                </div>
                                <div className="cn-conv-item__bottom">
                                    <span className="cn-conv-item__preview">{conv.lastMsg}</span>
                                    <span className={`cn-conv-item__role-tag ${conv.role?.toLowerCase()}`}>
                                        {conv.role?.toLowerCase() === "farmer" ? "🌾" : "🏪"} {conv.role}
                                    </span>
                                    {conv.unread > 0 && (
                                        <span className="cn-unread-badge">{conv.unread}</span>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </aside>
    );
}

export default ChatSidebar;
