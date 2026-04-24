import React, { useEffect, useRef, useState } from 'react';
import { Bot, Info, MessageSquare, PenSquare, Send, Sparkles, Sprout, TrendingUp, User } from 'lucide-react';
import '../CSS/ChatbotPage.css';
import { createChatSession, fetchChatSession, fetchChatSessions, sendChatMessage } from '../services/advisorApi';
import { useAuth } from '../context/AuthContext';

const formatInlineText = (text) => {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);

  return parts.map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={`${part}-${index}`}>{part.slice(2, -2)}</strong>;
    }

    return <React.Fragment key={`${part}-${index}`}>{part}</React.Fragment>;
  });
};

const renderMessageText = (text) => {
  const normalizedText = text.replace(/\r\n/g, '\n').trim();

  if (!normalizedText) {
    return null;
  }

  const lines = normalizedText.split('\n');
  const elements = [];
  let currentListItems = [];

  const flushList = () => {
    if (!currentListItems.length) return;

    elements.push(
      <ul key={`list-${elements.length}`} className="message-list">
        {currentListItems.map((item, index) => (
          <li key={`${item}-${index}`}>{formatInlineText(item)}</li>
        ))}
      </ul>
    );

    currentListItems = [];
  };

  lines.forEach((line, index) => {
    const trimmedLine = line.trim();
    const headingMatch = trimmedLine.match(/^#{1,6}\s+(.*)$/);
    const unorderedListMatch = trimmedLine.match(/^[-*]\s+(.*)$/);
    const orderedListMatch = trimmedLine.match(/^\d+\.\s+(.*)$/);

    if (!trimmedLine) {
      flushList();
      elements.push(<div key={`spacer-${index}`} className="message-spacer" />);
      return;
    }

    if (headingMatch) {
      flushList();
      elements.push(
        <p key={`heading-${index}`} className="message-heading">
          {formatInlineText(headingMatch[1])}
        </p>
      );
      return;
    }

    if (unorderedListMatch || orderedListMatch) {
      currentListItems.push((unorderedListMatch || orderedListMatch)[1]);
      return;
    }

    flushList();
    elements.push(
      <p key={`paragraph-${index}`} className="message-paragraph">
        {formatInlineText(trimmedLine)}
      </p>
    );
  });

  flushList();

  return elements;
};

const buildSessionSummary = (session) => {
  const lastMessage = session.messages[session.messages.length - 1];
  const previewText = lastMessage?.text?.replace(/\s+/g, ' ').trim() || '';

  return {
    id: session.id,
    title: session.title,
    updatedAt: session.updatedAt,
    createdAt: session.createdAt,
    messageCount: session.messages.length,
    lastMessagePreview: previewText.length > 80 ? `${previewText.slice(0, 77)}...` : previewText,
  };
};

const formatSessionTime = (value) => {
  if (!value) return '';

  const date = new Date(value);
  return date.toLocaleDateString([], { day: '2-digit', month: 'short' });
};

const ChatbotPage = () => {
  const { token } = useAuth();
  const [sessions, setSessions] = useState([]);
  const [activeSessionId, setActiveSessionId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isBootstrapping, setIsBootstrapping] = useState(true);
  const [isLoadingSession, setIsLoadingSession] = useState(false);
  const [error, setError] = useState('');
  const messagesEndRef = useRef(null);
  const activeSessionIdRef = useRef(null);

  useEffect(() => {
    activeSessionIdRef.current = activeSessionId;
  }, [activeSessionId]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const upsertSessionSummary = (session) => {
    const nextSummary = buildSessionSummary(session);

    setSessions((prev) => {
      const existing = prev.filter((item) => item.id !== nextSummary.id);
      return [nextSummary, ...existing].sort(
        (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      );
    });
  };

  const openSession = async (sessionId) => {
    setActiveSessionId(sessionId);
    setIsLoadingSession(true);
    setError('');

    try {
      const session = await fetchChatSession({ token, sessionId });
      if (activeSessionIdRef.current === sessionId || activeSessionIdRef.current === null) {
        setMessages(session.messages);
      }
      upsertSessionSummary(session);
    } catch (err) {
      setError(err.message || 'Failed to load chat session.');
    } finally {
      setIsLoadingSession(false);
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  useEffect(() => {
    const dashboardMain = document.querySelector('.dashboard-main');
    const dashboardContent = document.querySelector('.dashboard-content');
    const previousBodyOverflow = document.body.style.overflow;

    dashboardMain?.classList.add('dashboard-main--chatbot');
    dashboardContent?.classList.add('dashboard-content--chatbot');
    document.body.style.overflow = 'hidden';

    return () => {
      dashboardMain?.classList.remove('dashboard-main--chatbot');
      dashboardContent?.classList.remove('dashboard-content--chatbot');
      document.body.style.overflow = previousBodyOverflow;
    };
  }, []);

  useEffect(() => {
    if (!token) return;

    let cancelled = false;

    const bootstrap = async () => {
      setIsBootstrapping(true);
      setError('');

      try {
        const sessionList = await fetchChatSessions(token);
        if (cancelled) return;

        if (sessionList.length === 0) {
          setSessions([]);
          setActiveSessionId(null);
          setMessages([]);
          return;
        }

        setSessions(sessionList);
        const firstSessionId = sessionList[0].id;
        setActiveSessionId(firstSessionId);

        const firstSession = await fetchChatSession({ token, sessionId: firstSessionId });
        if (cancelled) return;

        setMessages(firstSession.messages);
        upsertSessionSummary(firstSession);
      } catch (err) {
        if (!cancelled) {
          setError(err.message || 'Failed to load advisor chats.');
        }
      } finally {
        if (!cancelled) {
          setIsBootstrapping(false);
        }
      }
    };

    bootstrap();

    return () => {
      cancelled = true;
    };
  }, [token]);

  const handleCreateSession = async () => {
    if (!token) return;

    setError('');

    try {
      const session = await createChatSession(token);
      setActiveSessionId(session.id);
      setMessages(session.messages);
      upsertSessionSummary(session);
      setInput('');
    } catch (err) {
      setError(err.message || 'Failed to create a new chat.');
    }
  };

  const handleSelectSession = async (sessionId) => {
    if (sessionId === activeSessionId) return;
    await openSession(sessionId);
  };

  const handleSend = async (text = input) => {
    const messageText = text.trim();

    if (!messageText || isTyping) return;

    let sessionId = activeSessionId;

    if (!sessionId) {
      try {
        const session = await createChatSession(token);
        sessionId = session.id;
        setActiveSessionId(session.id);
        setMessages(session.messages);
        upsertSessionSummary(session);
      } catch (err) {
        setError(err.message || 'Failed to create a new chat.');
        return;
      }
    }

    const pendingMessage = {
      id: `pending-${Date.now()}`,
      role: 'user',
      text: messageText,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, pendingMessage]);
    setInput('');
    setIsTyping(true);
    setError('');

    try {
      const session = await sendChatMessage({ token, sessionId, message: messageText });
      upsertSessionSummary(session);

      if (activeSessionIdRef.current === sessionId) {
        setMessages(session.messages);
      }
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: `error-${Date.now()}`,
          role: 'ai',
          text: err.message || 'Advisor is temporarily unavailable. Please try again.',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const suggestedPrompts = [
    { text: 'Show available rice or mustard listings near my area', icon: <TrendingUp size={14} /> },
    { text: 'Suggest crops for my next season using my saved data', icon: <Sparkles size={14} /> },
    { text: 'How to reduce blast disease risk in paddy?', icon: <Info size={14} /> },
  ];

  const isEmptyState = !isBootstrapping && !isLoadingSession && sessions.length === 0 && messages.length === 0;
  const activeSessionTitle = sessions.find((session) => session.id === activeSessionId)?.title || 'AI Advisor';

  return (
    <div className="chatbot-page-container">
      <aside className="chatbot-sidebar">
        <div className="chatbot-sidebar-top">
          <div className="chatbot-sidebar-title">
            <MessageSquare size={18} />
            <span>Chat History</span>
          </div>
          <button className="new-chat-button" onClick={handleCreateSession} type="button">
            <PenSquare size={16} />
            New Chat
          </button>
        </div>

        <div className="chatbot-session-list">
          {sessions.length === 0 ? (
            <div className="chatbot-sidebar-empty">
              <div className="chatbot-sidebar-empty-icon">
                <MessageSquare size={20} />
              </div>
              <strong>No chats yet</strong>
              <p>Your advisor history will appear here after you start your first conversation.</p>
            </div>
          ) : (
            sessions.map((session) => (
              <button
                key={session.id}
                type="button"
                className={`chatbot-session-item ${session.id === activeSessionId ? 'active' : ''}`}
                onClick={() => handleSelectSession(session.id)}
              >
                <div className="chatbot-session-row">
                  <strong>{session.title}</strong>
                  <span>{formatSessionTime(session.updatedAt)}</span>
                </div>
                <p>{session.lastMessagePreview || 'New conversation'}</p>
              </button>
            ))
          )}
        </div>
      </aside>

      <section className="chatbot-main-panel">
        <header className="chatbot-header">
          <div style={{ position: 'relative' }}>
            <div style={{ width: '45px', height: '45px', borderRadius: '12px', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary-dark)' }}>
              <Bot size={28} />
            </div>
            <div className="chatbot-status-dot" style={{ position: 'absolute', bottom: '-2px', right: '-2px', border: '2px solid var(--primary-dark)' }}></div>
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: '700' }}>{activeSessionTitle}</h3>
            <p style={{ margin: 0, fontSize: '0.8rem', opacity: 0.8 }}>Online - Database + AI Guidance</p>
          </div>
        </header>

        {error && <div className="chatbot-error-banner">{error}</div>}

        <div className="chat-messages-container">
          {isBootstrapping || isLoadingSession ? (
            <div className="chatbot-empty-state">Loading advisor chat...</div>
          ) : isEmptyState ? (
            <div className="chatbot-welcome-card">
              <div className="chatbot-welcome-icon">
                <Sprout size={28} />
              </div>
              <h2>Start your first advisor chat</h2>
              <p>
                Ask about available crops from the database, market analysis, crop planning, disease
                prevention, or selling strategy. Your conversations will be saved automatically here.
              </p>
              <div className="chatbot-welcome-actions">
                <button className="new-chat-button" onClick={handleCreateSession} type="button">
                  <PenSquare size={16} />
                  Start First Chat
                </button>
              </div>
              <div className="chatbot-welcome-tips">
                <div className="chatbot-welcome-tip">
                  <strong>Crop advice</strong>
                  <span>Best seasonal crops using your location and saved plans</span>
                </div>
                <div className="chatbot-welcome-tip">
                  <strong>Disease help</strong>
                  <span>Spot symptoms and prevention steps</span>
                </div>
                <div className="chatbot-welcome-tip">
                  <strong>Market planning</strong>
                  <span>Database-backed price trends and selling timing</span>
                </div>
              </div>
            </div>
          ) : (
            <>
              {messages.map((msg) => (
                <div key={msg.id} className={`message-bubble ${msg.role === 'ai' ? 'message-ai' : 'message-user'}`}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', opacity: 0.7, fontSize: '0.75rem' }}>
                    {msg.role === 'ai' ? <Bot size={14} /> : <User size={14} />}
                    <span>{msg.role === 'ai' ? 'Advisor' : 'You'} - {msg.time}</span>
                  </div>
                  <div className="message-content">
                    {renderMessageText(msg.text)}
                  </div>
                </div>
              ))}
              {isTyping && (
                <div className="message-bubble message-ai" style={{ width: 'fit-content' }}>
                  <div className="typing-indicator">
                    <span></span><span></span><span></span>
                  </div>
                </div>
              )}
            </>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="suggested-prompts">
          {suggestedPrompts.map((prompt, idx) => (
            <button
              key={idx}
              className="prompt-chip"
              onClick={() => handleSend(prompt.text)}
              disabled={isTyping || isBootstrapping || isLoadingSession}
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
              placeholder="Ask about available crops, market analysis, disease, or crop planning..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={isTyping || isBootstrapping || isLoadingSession}
            />
          </div>
          <button type="submit" className="send-button" disabled={!input.trim() || isTyping || isBootstrapping || isLoadingSession}>
            <Send size={20} />
          </button>
        </form>
      </section>

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
