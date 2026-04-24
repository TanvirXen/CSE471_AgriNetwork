import React, { useCallback, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X, Send, Bot } from 'lucide-react';
import '../CSS/Auth.css';
import { fetchAdvisorReply } from '../services/advisorApi';

const TRIGGER_DRAG_THRESHOLD = 8;

const Chatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isTriggerDragging, setIsTriggerDragging] = useState(false);
  const [windowPosition, setWindowPosition] = useState(null);
  const [triggerPosition, setTriggerPosition] = useState(null);
  const [isTyping, setIsTyping] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [messages, setMessages] = useState([
    {
      text: "Assalamu alaikum. I am AgriBot, your AgriNetwork advisor. I can guide you using available crop data, market analysis, and your ongoing conversation context.",
      sender: 'bot',
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const triggerRef = useRef(null);
  const chatbotWindowRef = useRef(null);
  const dragStateRef = useRef({
    active: false,
    offsetX: 0,
    offsetY: 0,
  });
  const triggerDragStateRef = useRef({
    active: false,
    offsetX: 0,
    offsetY: 0,
    startX: 0,
    startY: 0,
    moved: false,
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

  const clampTriggerPosition = useCallback((x, y) => {
    const trigger = triggerRef.current;
    const triggerWidth = trigger?.offsetWidth || 60;
    const triggerHeight = trigger?.offsetHeight || 60;
    const edgePadding = 8;
    const maxX = Math.max(edgePadding, window.innerWidth - triggerWidth - edgePadding);
    const maxY = Math.max(edgePadding, window.innerHeight - triggerHeight - edgePadding);

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

  const setDefaultTriggerPosition = useCallback(() => {
    const trigger = triggerRef.current;
    const triggerWidth = trigger?.offsetWidth || 60;
    const triggerHeight = trigger?.offsetHeight || 60;
    const defaultX = window.innerWidth - triggerWidth - 32;
    const defaultY = window.innerHeight - triggerHeight - 32;
    setTriggerPosition(clampTriggerPosition(defaultX, defaultY));
  }, [clampTriggerPosition]);

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

  const startTriggerDrag = useCallback((clientX, clientY) => {
    if (!triggerPosition) return;

    triggerDragStateRef.current = {
      active: true,
      offsetX: clientX - triggerPosition.x,
      offsetY: clientY - triggerPosition.y,
      startX: clientX,
      startY: clientY,
      moved: false,
    };
    setIsTriggerDragging(true);
  }, [triggerPosition]);

  const stopTriggerDrag = useCallback(() => {
    triggerDragStateRef.current.active = false;
    setIsTriggerDragging(false);
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
    const handleMouseMove = (e) => {
      if (!triggerDragStateRef.current.active) return;

      const deltaX = Math.abs(e.clientX - triggerDragStateRef.current.startX);
      const deltaY = Math.abs(e.clientY - triggerDragStateRef.current.startY);
      if (!triggerDragStateRef.current.moved && (deltaX > TRIGGER_DRAG_THRESHOLD || deltaY > TRIGGER_DRAG_THRESHOLD)) {
        triggerDragStateRef.current.moved = true;
      }
      if (!triggerDragStateRef.current.moved) return;

      const x = e.clientX - triggerDragStateRef.current.offsetX;
      const y = e.clientY - triggerDragStateRef.current.offsetY;
      setTriggerPosition(clampTriggerPosition(x, y));
    };

    const handleTouchMove = (e) => {
      if (!triggerDragStateRef.current.active || e.touches.length === 0) return;
      const touch = e.touches[0];

      const deltaX = Math.abs(touch.clientX - triggerDragStateRef.current.startX);
      const deltaY = Math.abs(touch.clientY - triggerDragStateRef.current.startY);
      if (!triggerDragStateRef.current.moved && (deltaX > TRIGGER_DRAG_THRESHOLD || deltaY > TRIGGER_DRAG_THRESHOLD)) {
        triggerDragStateRef.current.moved = true;
      }
      if (!triggerDragStateRef.current.moved) return;

      const x = touch.clientX - triggerDragStateRef.current.offsetX;
      const y = touch.clientY - triggerDragStateRef.current.offsetY;
      setTriggerPosition(clampTriggerPosition(x, y));
    };

    const handleDragEnd = () => stopTriggerDrag();

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
  }, [clampTriggerPosition, stopTriggerDrag]);

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

  useEffect(() => {
    const rafId = requestAnimationFrame(() => {
      if (!triggerPosition) {
        setDefaultTriggerPosition();
      } else {
        setTriggerPosition(clampTriggerPosition(triggerPosition.x, triggerPosition.y));
      }
    });

    const handleResize = () => {
      setTriggerPosition((prev) => {
        if (!prev) return prev;
        return clampTriggerPosition(prev.x, prev.y);
      });
    };

    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', handleResize);
    };
  }, [clampTriggerPosition, setDefaultTriggerPosition, triggerPosition]);

  const handleTriggerClick = () => {
    if (triggerDragStateRef.current.moved) {
      triggerDragStateRef.current.moved = false;
      return;
    }
    setIsOpen((prev) => !prev);
  };

  const handleSend = async (e) => {
    e.preventDefault();
    const messageText = inputValue.trim();
    if (!messageText || isTyping) return;

    const userMessage = { text: messageText, sender: 'user' };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);

    try {
      const response = await fetchAdvisorReply({
        message: messageText,
        sessionId,
      });
      setSessionId(response.sessionId);
      setMessages((prev) => [...prev, { text: response.reply, sender: 'bot' }]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          text: err.message || 'AgriBot is temporarily unavailable. Please try again.',
          sender: 'bot',
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <>
      <button
        ref={triggerRef}
        className={`chatbot-trigger ${isTriggerDragging ? 'dragging' : ''}`}
        onMouseDown={(e) => {
          if (e.button !== 0) return;
          startTriggerDrag(e.clientX, e.clientY);
        }}
        onTouchStart={(e) => {
          if (e.touches.length === 0) return;
          const touch = e.touches[0];
          startTriggerDrag(touch.clientX, touch.clientY);
        }}
        onClick={handleTriggerClick}
        style={triggerPosition ? {
          left: `${triggerPosition.x}px`,
          top: `${triggerPosition.y}px`,
          right: 'auto',
          bottom: 'auto',
        } : undefined}
      >
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
                <span style={{ fontWeight: '600' }}>AgriBot Advisor</span>
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
              {isTyping && <div className="message bot">AgriBot is typing...</div>}
            </div>

            <form className="chatbot-input" onSubmit={handleSend}>
              <input 
                type="text" 
                placeholder="Ask about available crops, market trends, or crop decisions..." 
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                disabled={isTyping}
              />
              <button type="submit" style={{ color: 'var(--primary-main)' }} disabled={isTyping || !inputValue.trim()}>
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
