import React, { useCallback, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X, Send, Bot } from 'lucide-react';
import '../CSS/Auth.css';

const Chatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [windowPosition, setWindowPosition] = useState(null);
  const [messages, setMessages] = useState([
    { text: "Hi! I'm AgriBot. How can I help you today?", sender: 'bot' }
  ]);
  const [inputValue, setInputValue] = useState('');
  const chatbotWindowRef = useRef(null);
  const dragStateRef = useRef({
    active: false,
    offsetX: 0,
    offsetY: 0,
  });

  const clampPosition = useCallback((x, y) => {
    const widget = chatbotWindowRef.current;
    const widgetWidth = widget?.offsetWidth || 350;
    const widgetHeight = widget?.offsetHeight || 450;
    const edgePadding = 8;
    const maxX = Math.max(edgePadding, window.innerWidth - widgetWidth - edgePadding);
    const maxY = Math.max(edgePadding, window.innerHeight - widgetHeight - edgePadding);
    return {
      x: Math.min(Math.max(edgePadding, x), maxX),
      y: Math.min(Math.max(edgePadding, y), maxY),
    };
  }, []);

  const setDefaultWindowPosition = useCallback(() => {
    const widget = chatbotWindowRef.current;
    const widgetWidth = widget?.offsetWidth || 350;
    const widgetHeight = widget?.offsetHeight || 450;
    const defaultX = window.innerWidth - widgetWidth - 32;
    const defaultY = window.innerHeight - widgetHeight - 104;
    setWindowPosition(clampPosition(defaultX, defaultY));
  }, [clampPosition]);

  const startDrag = useCallback((clientX, clientY) => {
    if (!windowPosition) return;
    dragStateRef.current = {
      active: true,
      offsetX: clientX - windowPosition.x,
      offsetY: clientY - windowPosition.y,
    };
    setIsDragging(true);
  }, [windowPosition]);

  const stopDrag = useCallback(() => {
    dragStateRef.current.active = false;
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    const handleMouseMove = (e) => {
      if (!dragStateRef.current.active) return;
      const x = e.clientX - dragStateRef.current.offsetX;
      const y = e.clientY - dragStateRef.current.offsetY;
      setWindowPosition(clampPosition(x, y));
    };

    const handleTouchMove = (e) => {
      if (!dragStateRef.current.active || e.touches.length === 0) return;
      const touch = e.touches[0];
      const x = touch.clientX - dragStateRef.current.offsetX;
      const y = touch.clientY - dragStateRef.current.offsetY;
      setWindowPosition(clampPosition(x, y));
    };

    const handleDragEnd = () => stopDrag();

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleDragEnd);
    window.addEventListener('touchmove', handleTouchMove, { passive: true });
    window.addEventListener('touchend', handleDragEnd);
    window.addEventListener('touchcancel', handleDragEnd);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleDragEnd);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleDragEnd);
      window.removeEventListener('touchcancel', handleDragEnd);
    };
  }, [clampPosition, isOpen, stopDrag]);

  useEffect(() => {
    if (!isOpen) return;

    const rafId = requestAnimationFrame(() => {
      if (!windowPosition) {
        setDefaultWindowPosition();
      } else {
        setWindowPosition(clampPosition(windowPosition.x, windowPosition.y));
      }
    });

    const handleResize = () => {
      setWindowPosition((prev) => {
        if (!prev) return prev;
        return clampPosition(prev.x, prev.y);
      });
    };

    window.addEventListener('resize', handleResize);
    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', handleResize);
    };
  }, [clampPosition, isOpen, setDefaultWindowPosition, windowPosition]);

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
            ref={chatbotWindowRef}
            className="chatbot-window"
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            style={windowPosition ? {
              left: `${windowPosition.x}px`,
              top: `${windowPosition.y}px`,
              right: 'auto',
              bottom: 'auto',
            } : undefined}
          >
            <div
              className={`chatbot-header ${isDragging ? 'dragging' : ''}`}
              onMouseDown={(e) => {
                if (e.button !== 0) return;
                startDrag(e.clientX, e.clientY);
              }}
              onTouchStart={(e) => {
                if (e.touches.length === 0) return;
                const touch = e.touches[0];
                startDrag(touch.clientX, touch.clientY);
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Bot size={20} />
                <span style={{ fontWeight: '600' }}>AgriBot Support</span>
              </div>
              <X
                size={20}
                style={{ cursor: 'pointer' }}
                onMouseDown={(e) => e.stopPropagation()}
                onTouchStart={(e) => e.stopPropagation()}
                onClick={() => setIsOpen(false)}
              />
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
