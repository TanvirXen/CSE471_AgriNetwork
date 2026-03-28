import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Sparkles, TrendingUp, Info } from 'lucide-react';
import '../CSS/ChatbotPage.css';
import { fetchAdvisorReply } from '../services/advisorApi';

const ChatbotPage = () => {
  const [messages, setMessages] = useState([
    {
      id: 1,
      role: 'ai',
      text: 'Assalamu alaikum. I am your AI agriculture advisor for Bangladesh. Ask me about seasonal crop planning, pest and disease decisions, or market strategy.',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSend = async (text = input) => {
    const messageText = text.trim();
    if (!messageText || isTyping) return;

    const userMessage = {
      id: messages.length + 1,
      role: 'user',
      text: messageText,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    const historyForApi = messages.map((msg) => ({
      role: msg.role === 'user' ? 'user' : 'assistant',
      text: msg.text,
    }));

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    try {
      const reply = await fetchAdvisorReply({
        message: messageText,
        history: historyForApi,
      });

      setMessages((prev) => [
        ...prev,
        {
          id: prev.length + 1,
          role: 'ai',
          text: reply,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: prev.length + 1,
          role: 'ai',
          text: err.message || 'Advisor is temporarily unavailable. Please try again.',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const suggestedPrompts = [
    { text: "What's the current market price for Boro Rice?", icon: <TrendingUp size={14} /> },
    { text: 'Suggest crops for the next season in Bangladesh', icon: <Sparkles size={14} /> },
    { text: 'How to reduce blast disease risk in paddy?', icon: <Info size={14} /> }
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
            disabled={isTyping}
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
            placeholder="Ask about crop planning, disease, irrigation, or market timing..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isTyping}
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
