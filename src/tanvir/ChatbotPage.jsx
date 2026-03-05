import React, { useState, useRef, useEffect } from 'react';
import { Send, Paperclip, ChevronLeft, MoreVertical, Leaf, TrendingUp, Sun, Droplet, MessageSquare, Plus, Settings, History, CloudRain, Info, Menu, BarChart2 } from 'lucide-react';
import ChatMessage from './components/ChatMessage';
import './css/chatbot.css'; // Custom styles and animations

const ChatbotPage = () => {
    const [messages, setMessages] = useState([
        {
            id: 1,
            text: "Hello! I'm AgriAssist AI. I can help you with crop information, real-time market analysis, and farming best practices based on our latest database. What would you like to know today?",
            isBot: true,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
    ]);
    const [inputValue, setInputValue] = useState("");
    const [isTyping, setIsTyping] = useState(false);
    const messagesEndRef = useRef(null);

    // Suggested prompts for the user
    const suggestedPrompts = [
        { icon: <TrendingUp size={16} className="text-emerald-500" />, text: "Current market price for Wheat" },
        { icon: <Leaf size={16} className="text-emerald-500" />, text: "Best crops for winter season" },
        { icon: <Droplet size={16} className="text-emerald-500" />, text: "Irrigation techniques for Tomato" },
        { icon: <Sun size={16} className="text-emerald-500" />, text: "Weather impact on Rice harvest" }
    ];

    // Mock bot responses based on keywords
    const generateBotResponse = (userInput) => {
        const input = userInput.toLowerCase();
        let response = "";

        if (input.includes("wheat") || input.includes("price") || input.includes("market")) {
            response = "Based on our latest market analysis, the current average market price for Wheat is ৳32/kg. The trend shows a 5% increase in demand this month. Considering the current weather, it's a good time to sell if you have stored harvest.";
        } else if (input.includes("winter") || input.includes("crop")) {
            response = "For the upcoming winter season, our database recommends planting Cabbage, Cauliflower, Tomatoes, and Carrots. These vegetables thrive in cool weather and currently show a high profitability margin in local markets.";
        } else if (input.includes("irrigation") || input.includes("tomato") || input.includes("water")) {
            response = "Tomatoes require consistent moisture. We recommend drip irrigation to maintain even soil moisture and prevent foliar diseases. Ensure you provide about 1-2 inches of water per week, depending on soil type.";
        } else {
            response = "That's an excellent question. While I am still learning, our database suggests consulting the local agricultural extension office for highly specific queries. Is there anything about crop prices or standard farming practices I can assist you with?";
        }

        return response;
    };

    const handleSendMessage = (text = inputValue) => {
        if (!text.trim()) return;

        // Add user message
        const newUserMsg = {
            id: Date.now(),
            text: text,
            isBot: false,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };

        setMessages(prev => [...prev, newUserMsg]);
        setInputValue("");
        setIsTyping(true);

        // Simulate bot thinking and responding
        setTimeout(() => {
            const botResponseMsg = {
                id: Date.now() + 1,
                text: generateBotResponse(text),
                isBot: true,
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            };
            setMessages(prev => [...prev, botResponseMsg]);
            setIsTyping(false);
        }, 1500);
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    // Auto-scroll to bottom of messages
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isTyping]);

    return (
        <div className="h-screen w-full bg-[#f8fafc] flex font-sans overflow-hidden">

            {/* Left Sidebar - Chat History & Nav */}
            <div className="w-64 bg-white border-r border-gray-200 hidden md:flex flex-col flex-shrink-0 z-20">
                <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-emerald-700 font-bold text-lg">
                        <Leaf size={24} />
                        <span>AgriNetwork</span>
                    </div>
                </div>

                <div className="p-4 flex-shrink-0">
                    <button className="w-full flex items-center gap-2 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 p-3 rounded-xl transition-colors font-medium text-sm border border-emerald-200/50">
                        <Plus size={18} />
                        New Conversation
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto sidebar-scrollbar px-3">
                    <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 px-2 mt-2">Recent Chats</div>

                    <div className="space-y-1">
                        <button className="w-full flex items-center gap-3 bg-gray-50 text-gray-800 p-2.5 rounded-lg text-sm font-medium border border-gray-100">
                            <MessageSquare size={16} className="text-emerald-500 flex-shrink-0" />
                            <span className="truncate">Wheat Market Prices</span>
                        </button>
                        <button className="w-full flex items-center gap-3 text-gray-600 hover:bg-gray-50 hover:text-gray-800 p-2.5 rounded-lg text-sm font-medium transition-colors">
                            <MessageSquare size={16} className="text-gray-400 flex-shrink-0" />
                            <span className="truncate">Winter Crop Planning</span>
                        </button>
                        <button className="w-full flex items-center gap-3 text-gray-600 hover:bg-gray-50 hover:text-gray-800 p-2.5 rounded-lg text-sm font-medium transition-colors">
                            <MessageSquare size={16} className="text-gray-400 flex-shrink-0" />
                            <span className="truncate">Tomato Irrigation Tips</span>
                        </button>
                        <button className="w-full flex items-center gap-3 text-gray-600 hover:bg-gray-50 hover:text-gray-800 p-2.5 rounded-lg text-sm font-medium transition-colors">
                            <MessageSquare size={16} className="text-gray-400 flex-shrink-0" />
                            <span className="truncate">Soil Ph testing</span>
                        </button>
                    </div>
                </div>

                <div className="p-4 border-t border-gray-100 space-y-2 flex-shrink-0">
                    <button className="w-full flex items-center gap-3 text-gray-600 hover:bg-gray-50 p-2.5 rounded-lg text-sm font-medium transition-colors">
                        <History size={18} />
                        Chat History
                    </button>
                    <button className="w-full flex items-center gap-3 text-gray-600 hover:bg-gray-50 p-2.5 rounded-lg text-sm font-medium transition-colors">
                        <Settings size={18} />
                        Settings
                    </button>
                </div>
            </div>

            {/* Main Chat Area */}
            <div className="flex-1 flex flex-col h-full relative min-w-0 bg-white shadow-[0_0_40px_rgba(0,0,0,0.02)] z-10">

                {/* Header */}
                <div className="bg-white/80 backdrop-blur-md border-b border-gray-100 p-4 flex items-center justify-between z-20 flex-shrink-0">
                    <div className="flex items-center gap-3">
                        <button className="p-2 -ml-2 text-gray-500 hover:bg-gray-100 rounded-full transition-colors md:hidden">
                            <Menu size={24} />
                        </button>
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-green-600 rounded-full flex items-center justify-center text-white shadow-sm">
                                <Leaf size={20} strokeWidth={2.5} />
                            </div>
                            <div>
                                <h1 className="text-lg font-bold text-gray-800 leading-tight">AgriAssist AI</h1>
                                <div className="flex items-center gap-1.5 text-emerald-600 text-xs font-medium">
                                    <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                                    Online - Ready to help
                                </div>
                            </div>
                        </div>
                    </div>
                    <button className="p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 rounded-full transition-colors">
                        <MoreVertical size={20} />
                    </button>
                </div>

                {/* Messages Area */}
                <div className="flex-1 overflow-y-auto p-4 sm:p-6 messages-area relative bg-[#f8fafc]/50">

                    {/* subtle background pattern */}
                    <div className="absolute inset-0 opacity-[0.02] pointer-events-none"
                        style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23059669\' fill-opacity=\'1\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")' }}>
                    </div>

                    <div className="max-w-3xl mx-auto z-10 relative">
                        {/* Date separator */}
                        <div className="flex justify-center mb-8">
                            <span className="text-[11px] font-bold uppercase tracking-widest text-gray-400 bg-white border border-gray-100 shadow-sm px-4 py-1.5 rounded-full">
                                Today
                            </span>
                        </div>

                        {/* Messages Loop */}
                        {messages.map((msg) => (
                            <ChatMessage key={msg.id} message={msg} />
                        ))}

                        {/* Typing Indicator */}
                        {isTyping && <ChatMessage isTyping={true} />}

                        {/* Suggested Prompts (only show if few messages) */}
                        {messages.length < 3 && !isTyping && (
                            <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-2xl mx-auto animate-message" style={{ animationDelay: '0.4s' }}>
                                {suggestedPrompts.map((prompt, index) => (
                                    <button
                                        key={index}
                                        onClick={() => handleSendMessage(prompt.text)}
                                        className="suggested-prompt flex items-center gap-3 p-3.5 bg-white border border-gray-200 rounded-xl text-left text-sm font-medium text-gray-700 hover:border-emerald-400 hover:shadow-md hover:text-emerald-700 focus:outline-none"
                                    >
                                        <div className="bg-emerald-50 text-emerald-600 p-2.5 rounded-lg flex-shrink-0">
                                            {prompt.icon}
                                        </div>
                                        <span>{prompt.text}</span>
                                    </button>
                                ))}
                            </div>
                        )}

                        <div ref={messagesEndRef} className="h-4" />
                    </div>
                </div>

                {/* Input Area */}
                <div className="bg-white p-4 sm:p-5 border-t border-gray-100 z-20 flex-shrink-0">
                    <div className="max-w-4xl mx-auto">
                        <div className="flex items-end gap-2 bg-gray-50/80 p-2 border border-gray-200/80 rounded-2xl focus-within:ring-4 focus-within:ring-emerald-500/10 focus-within:border-emerald-400 focus-within:bg-white transition-all shadow-sm">

                            <button className="p-3 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-colors flex-shrink-0">
                                <Paperclip size={20} />
                            </button>

                            <textarea
                                className="flex-1 max-h-32 min-h-[44px] bg-transparent resize-none border-0 focus:ring-0 p-3 text-gray-700 placeholder-gray-400 outline-none leading-relaxed"
                                placeholder="Message AgriAssist about crops, markets..."
                                rows={1}
                                value={inputValue}
                                onChange={(e) => {
                                    setInputValue(e.target.value);
                                    e.target.style.height = 'auto';
                                    e.target.style.height = e.target.scrollHeight + 'px';
                                }}
                                onKeyDown={handleKeyPress}
                            />

                            <button
                                onClick={() => handleSendMessage()}
                                disabled={!inputValue.trim()}
                                className={`p-3.5 rounded-xl flex-shrink-0 transition-all shadow-sm ${inputValue.trim()
                                        ? 'bg-emerald-600 text-white hover:bg-emerald-700 hover:shadow-emerald-600/30'
                                        : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                    }`}
                            >
                                <Send size={20} className={inputValue.trim() ? "translate-x-0.5 -translate-y-0.5" : ""} />
                            </button>
                        </div>
                        <div className="text-center mt-3 flex items-center justify-center gap-1.5 text-xs text-gray-400 font-medium">
                            <Info size={14} className="flex-shrink-0" />
                            AgriAssist AI may occasionally produce inaccurate information. Please verify critical farming decisions.
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Sidebar - Optional Features & Widgets */}
            <div className="w-80 bg-[#fefefe] border-l border-gray-200 hidden lg:flex flex-col flex-shrink-0 z-20">
                <div className="p-5 border-b border-gray-100 flex-shrink-0">
                    <h2 className="text-sm font-bold text-gray-800 uppercase tracking-wide">Market Insights</h2>
                </div>

                <div className="flex-1 overflow-y-auto sidebar-scrollbar p-5 space-y-6">

                    {/* Widget 1: Trending Crops */}
                    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-semibold text-gray-800 flex items-center gap-2 text-sm">
                                <TrendingUp size={16} className="text-emerald-500" />
                                Trending Prices
                            </h3>
                            <button className="text-xs text-emerald-600 font-medium hover:underline">View All</button>
                        </div>

                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center text-orange-600 font-bold text-xs border border-orange-100 flex-shrink-0">Wh</div>
                                    <span className="text-sm font-medium text-gray-700">Wheat</span>
                                </div>
                                <div className="text-right">
                                    <div className="text-sm font-bold text-gray-800">৳32/kg</div>
                                    <div className="text-xs text-green-500 font-medium flex items-center gap-0.5 justify-end">+1.2% <TrendingUp size={10} /></div>
                                </div>
                            </div>

                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center text-red-600 font-bold text-xs border border-red-100 flex-shrink-0">To</div>
                                    <span className="text-sm font-medium text-gray-700">Tomato</span>
                                </div>
                                <div className="text-right">
                                    <div className="text-sm font-bold text-gray-800">৳45/kg</div>
                                    <div className="text-xs text-red-500 font-medium flex items-center gap-0.5 justify-end">-0.5% <TrendingUp size={10} className="rotate-180" /></div>
                                </div>
                            </div>

                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-lg bg-yellow-50 flex items-center justify-center text-yellow-600 font-bold text-xs border border-yellow-100 flex-shrink-0">Ri</div>
                                    <span className="text-sm font-medium text-gray-700">Rice</span>
                                </div>
                                <div className="text-right">
                                    <div className="text-sm font-bold text-gray-800">৳65/kg</div>
                                    <div className="text-xs text-green-500 font-medium flex items-center gap-0.5 justify-end">+2.1% <TrendingUp size={10} /></div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Widget 2: Weather Snapshot */}
                    <div className="bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl shadow-md p-4 text-white relative overflow-hidden">
                        {/* decorative circles */}
                        <div className="absolute top-[-20px] right-[-20px] w-24 h-24 bg-white/10 rounded-full blur-xl"></div>
                        <div className="absolute bottom-[-10px] left-[-10px] w-16 h-16 bg-blue-400/20 rounded-full blur-lg"></div>

                        <div className="flex justify-between items-start relative z-10">
                            <div>
                                <h3 className="font-semibold text-white/90 flex items-center gap-2 text-sm mb-1">
                                    <CloudRain size={16} />
                                    Rain Probability
                                </h3>
                                <div className="text-3xl font-bold mt-2">65%</div>
                                <div className="text-xs text-blue-100 mt-1">Expected this evening</div>
                            </div>
                            <Sun size={40} className="text-yellow-300 opacity-80" strokeWidth={1.5} />
                        </div>
                        <div className="mt-4 pt-3 border-t border-white/20 flex justify-between text-xs font-medium text-blue-50 relative z-10">
                            <span>Humidity: 78%</span>
                            <span>Wind: 12 km/h</span>
                        </div>
                    </div>

                    {/* Widget 3: Quick Tools */}
                    <div>
                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 px-1">Quick Tools</h3>
                        <div className="grid grid-cols-2 gap-3">
                            <button className="flex flex-col items-center justify-center gap-2 p-3 bg-white border border-gray-100 rounded-xl hover:border-emerald-300 hover:shadow-sm transition-all text-gray-600 hover:text-emerald-600">
                                <div className="bg-emerald-50 p-2 rounded-lg">
                                    <Leaf size={20} />
                                </div>
                                <span className="text-xs font-medium">Crop Guide</span>
                            </button>
                            <button className="flex flex-col items-center justify-center gap-2 p-3 bg-white border border-gray-100 rounded-xl hover:border-emerald-300 hover:shadow-sm transition-all text-gray-600 hover:text-emerald-600">
                                <div className="bg-blue-50 text-blue-600 p-2 rounded-lg">
                                    <Droplet size={20} />
                                </div>
                                <span className="text-xs font-medium">Irrigation</span>
                            </button>
                            <button className="flex flex-col items-center justify-center gap-2 p-3 bg-white border border-gray-100 rounded-xl hover:border-emerald-300 hover:shadow-sm transition-all text-gray-600 hover:text-emerald-600">
                                <div className="bg-purple-50 text-purple-600 p-2 rounded-lg">
                                    <BarChart2 size={20} />
                                </div>
                                <span className="text-xs font-medium">Yield Calc</span>
                            </button>
                            <button className="flex flex-col items-center justify-center gap-2 p-3 bg-white border border-gray-100 rounded-xl hover:border-emerald-300 hover:shadow-sm transition-all text-gray-600 hover:text-emerald-600">
                                <div className="bg-orange-50 text-orange-600 p-2 rounded-lg">
                                    <Sun size={20} />
                                </div>
                                <span className="text-xs font-medium">Soil Health</span>
                            </button>
                        </div>
                    </div>

                </div>
            </div>

        </div>
    );
};

export default ChatbotPage;
