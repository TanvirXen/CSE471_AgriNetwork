import { API_BASE_URL } from "../config/network";

const getAuthHeaders = (token) => ({
  "Content-Type": "application/json",
  "x-auth-token": token,
});

const parseJson = async (response) => {
  try {
    return await response.json();
  } catch {
    return {};
  }
};

export const fetchChatSessions = async (token) => {
  const response = await fetch(`${API_BASE_URL}/api/chatbot/sessions`, {
    headers: getAuthHeaders(token),
  });

  const payload = await parseJson(response);

  if (!response.ok) {
    throw new Error(payload.message || "Failed to load chat sessions.");
  }

  return payload.sessions || [];
};

export const createChatSession = async (token) => {
  const response = await fetch(`${API_BASE_URL}/api/chatbot/sessions`, {
    method: "POST",
    headers: getAuthHeaders(token),
  });

  const payload = await parseJson(response);

  if (!response.ok) {
    throw new Error(payload.message || "Failed to create chat session.");
  }

  return payload.session;
};

export const fetchChatSession = async ({ token, sessionId }) => {
  const response = await fetch(`${API_BASE_URL}/api/chatbot/sessions/${sessionId}`, {
    headers: getAuthHeaders(token),
  });

  const payload = await parseJson(response);

  if (!response.ok) {
    throw new Error(payload.message || "Failed to load chat session.");
  }

  return payload.session;
};

export const sendChatMessage = async ({ token, sessionId, message }) => {
  const response = await fetch(`${API_BASE_URL}/api/chatbot/sessions/${sessionId}/reply`, {
    method: "POST",
    headers: getAuthHeaders(token),
    body: JSON.stringify({ message }),
  });

  const payload = await parseJson(response);

  if (!response.ok) {
    throw new Error(payload.message || "Failed to get advisor response.");
  }

  return payload.session;
};

export const fetchAdvisorReply = async ({ message, sessionId }) => {
  const token = localStorage.getItem("token");

  if (!token) {
    throw new Error("Please log in to use the advisor.");
  }

  let activeSessionId = sessionId;

  if (!activeSessionId) {
    const session = await createChatSession(token);
    activeSessionId = session.id;
  }

  const updatedSession = await sendChatMessage({
    token,
    sessionId: activeSessionId,
    message,
  });

  return {
    sessionId: updatedSession.id,
    reply: updatedSession.messages[updatedSession.messages.length - 1]?.text || "",
    session: updatedSession,
  };
};
