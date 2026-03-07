// ChatSidebar.jsx — AgriNetwork Bangladesh
// Left panel: search + conversation list

const CONVERSATIONS = [
    {
        id: 1,
        name: "Rahim Uddin",
        role: "farmer",
        avatar: "RU",
        lastMsg: "৳55/kg is my final offer for the rice.",
        time: "2m",
        unread: 2,
        online: true,
        crop: "Rice",
    },
    {
        id: 2,
        name: "Dhaka Fresh Ltd.",
        role: "vendor",
        avatar: "DF",
        lastMsg: "We can pick up from Manikganj on Friday.",
        time: "18m",
        unread: 0,
        online: true,
        crop: "Potato",
    },
    {
        id: 3,
        name: "Karim Agro",
        role: "vendor",
        avatar: "KA",
        lastMsg: "Counter offer accepted ✔",
        time: "1h",
        unread: 0,
        online: false,
        crop: "Onion",
    },
    {
        id: 4,
        name: "Nasreen Begum",
        role: "farmer",
        avatar: "NB",
        lastMsg: "How much for 500 kg of mustard?",
        time: "3h",
        unread: 1,
        online: true,
        crop: "Mustard",
    },
    {
        id: 5,
        name: "BD Spice House",
        role: "vendor",
        avatar: "BS",
        lastMsg: "Deal confirmed! Payment on delivery.",
        time: "Yesterday",
        unread: 0,
        online: false,
        crop: "Garlic",
    },
    {
        id: 6,
        name: "Mojibur Rahman",
        role: "farmer",
        avatar: "MR",
        lastMsg: "My tomatoes are fully ripe now.",
        time: "Yesterday",
        unread: 0,
        online: false,
        crop: "Tomato",
    },
    {
        id: 7,
        name: "Sylhet Market Co.",
        role: "vendor",
        avatar: "SM",
        lastMsg: "Can you do ৳90/kg for lentils?",
        time: "2d",
        unread: 3,
        online: true,
        crop: "Lentil",
    },
];

function ChatSidebar({ activeId, onSelect, isOpen }) {
    return (
        <aside className={`cn-sidebar${isOpen ? " open" : ""}`}>
            {/* Search */}
            <div className="cn-sidebar__header">
                <div className="cn-sidebar__search">
                    <span className="cn-sidebar__search-icon">🔍</span>
                    <input placeholder="Search farmers, vendors, crops…" />
                </div>
                <div className="cn-sidebar__tabs">
                    <button className="cn-sidebar__tab active">All</button>
                    <button className="cn-sidebar__tab">Farmers</button>
                    <button className="cn-sidebar__tab">Vendors</button>
                </div>
            </div>

            {/* Conversation List */}
            <div className="cn-sidebar__list">
                {CONVERSATIONS.map((conv) => (
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
                                <span className={`cn-conv-item__role-tag ${conv.role}`}>
                                    {conv.role === "farmer" ? "🌾" : "🏪"} {conv.role}
                                </span>
                                {conv.unread > 0 && (
                                    <span className="cn-unread-badge">{conv.unread}</span>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </aside>
    );
}

export { CONVERSATIONS };
export default ChatSidebar;
