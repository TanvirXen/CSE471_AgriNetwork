import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X, Send, Bot } from 'lucide-react';
import '../CSS/Auth.css';

const Chatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { text: "Hi! I'm AgriBot. How can I help you today?", sender: 'bot' }
  ]);
  const [inputValue, setInputValue] = useState('');

  const handleSend = (e) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    const userMessage = { text: inputValue, sender: 'user' };
    setMessages(prev => [...prev, userMessage]);
    setInputValue('');

    // Simple bot response simulation
    setTimeout(() => {
      let botResponse = "That's interesting! Tell me more about your requirements.";
      if (inputValue.toLowerCase().includes('signup')) {
        botResponse = "To sign up, just click on 'Create account' on the login page. You can choose to be a vendor or a customer!";
      } else if (inputValue.toLowerCase().includes('nid')) {
        botResponse = "NID verification is required to build trust in our marketplace. You'll need to upload clear photos of both sides.";
      }
      setMessages(prev => [...prev, { text: botResponse, sender: 'bot' }]);
    }, 1000);
  };

  return (
    <>
      <button className="chatbot-trigger" onClick={() => setIsOpen(!isOpen)}>
        {isOpen ? <X size={28} /> : <MessageCircle size={28} />}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div 
            className="chatbot-window"
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
          >
            <div className="chatbot-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Bot size={20} />
                <span style={{ fontWeight: '600' }}>AgriBot Support</span>
              </div>
              <X size={20} style={{ cursor: 'pointer' }} onClick={() => setIsOpen(false)} />
            </div>

            <div className="chatbot-messages">
              {messages.map((msg, index) => (
                <div key={index} className={`message ${msg.sender}`}>
                  {msg.text}
                </div>
              ))}
            </div>

            <form className="chatbot-input" onSubmit={handleSend}>
              <input 
                type="text" 
                placeholder="Type your message..." 
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
              />
              <button type="submit" style={{ color: 'var(--primary-main)' }}>
                <Send size={20} />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Chatbot;
