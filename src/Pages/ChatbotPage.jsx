import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Bot, User, Sparkles, TrendingUp, HelpCircle, Info } from 'lucide-react';
import '../CSS/ChatbotPage.css';

const ChatbotPage = () => {
  const [messages, setMessages] = useState([
    {
      id: 1,
      role: 'ai',
      text: "Hello! I'm your AgriNetwork Advisor. I have access to our real-time database of crops, market trends, and seasonal advice. How can I help you today?",
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSend = (text = input) => {
    if (!text.trim()) return;

    const userMessage = {
      id: messages.length + 1,
      role: 'user',
      text: text,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages([...messages, userMessage]);
    setInput('');
    setIsTyping(true);

    // Simulate AI response based on keywords
    setTimeout(() => {
      let aiText = "I'm analyzing that for you. Based on our current market data, the demand for seasonal crops remains high in your region.";
      
      const lowerText = text.toLowerCase();
      if (lowerText.includes('price') || lowerText.includes('market')) {
        aiText = "Current market analysis shows that Boro Rice prices have stabilized at ৳45/kg, while Organic Wheat is seeing a 15% increase in demand from wholesale buyers this week.";
      } else if (lowerText.includes('crop') || lowerText.includes('advice')) {
        aiText = "Based on your location and the upcoming season, it's an ideal time to prepare for Vegetable cultivation. Our top-performing farmers are currently focusing on high-yield hybrid varieties.";
      } else if (lowerText.includes('available') || lowerText.includes('inventory')) {
        aiText = "Searching our database... We currently have 120+ verified listings for Rice, 45 for Fish, and a growing list of Poultry sellers in your district.";
      }

      setMessages(prev => [...prev, {
        id: prev.length + 1,
        role: 'ai',
        text: aiText,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);
      setIsTyping(false);
    }, 1500);
  };

  const suggestedPrompts = [
    { text: "What's the current market price for Boro Rice?", icon: <TrendingUp size={14} /> },
    { text: "Suggest crops for the next season", icon: <Sparkles size={14} /> },
    { text: "Show available wholesale fish stocks", icon: <Info size={14} /> }
  ];

  return (
    <div className="chatbot-page-container">
      <header className="chatbot-header">
        <div style={{ position: 'relative' }}>
          <div style={{ width: '45px', height: '45px', borderRadius: '12px', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary-dark)' }}>
            <Bot size={28} />
          </div>
          <div className="chatbot-status-dot" style={{ position: 'absolute', bottom: '-2px', right: '-2px', border: '2px solid var(--primary-dark)' }}></div>
        </div>
        <div>
          <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: '700' }}>Agri-Intelligence Advisor</h3>
          <p style={{ margin: 0, fontSize: '0.8rem', opacity: 0.8 }}>Online • AI Powered Guidance</p>
        </div>
      </header>

      <div className="chat-messages-container">
        {messages.map((msg) => (
          <div key={msg.id} className={`message-bubble ${msg.role === 'ai' ? 'message-ai' : 'message-user'}`}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', opacity: 0.7, fontSize: '0.75rem' }}>
              {msg.role === 'ai' ? <Bot size={14} /> : <User size={14} />}
              <span>{msg.role === 'ai' ? 'Advisor' : 'You'} • {msg.time}</span>
            </div>
            {msg.text}
          </div>
        ))}
        {isTyping && (
          <div className="message-bubble message-ai" style={{ width: 'fit-content' }}>
            <div className="typing-indicator">
              <span></span><span></span><span></span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="suggested-prompts">
        {suggestedPrompts.map((prompt, idx) => (
          <button 
            key={idx} 
            className="prompt-chip" 
            onClick={() => handleSend(prompt.text)}
          >
            {prompt.icon}
            {prompt.text}
          </button>
        ))}
      </div>

      <form className="chat-input-area" onSubmit={(e) => { e.preventDefault(); handleSend(); }}>
        <div className="chat-input-wrapper">
          <input 
            type="text" 
            className="chat-input-field" 
            placeholder="Ask about market prices, crop advice, or database listings..." 
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
        </div>
        <button type="submit" className="send-button" disabled={!input.trim() || isTyping}>
          <Send size={20} />
        </button>
      </form>

      <style>{`
        .typing-indicator span {
          height: 8px;
          width: 8px;
          background: var(--primary-main);
          display: inline-block;
          border-radius: 50%;
          margin: 0 2px;
          opacity: 0.4;
          animation: typing 1s infinite;
        }
        .typing-indicator span:nth-child(2) { animation-delay: 0.2s; }
        .typing-indicator span:nth-child(3) { animation-delay: 0.4s; }
        @keyframes typing {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-5px); opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default ChatbotPage;
