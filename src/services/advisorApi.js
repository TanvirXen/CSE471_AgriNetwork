const API_BASE_URL = import.meta.env.VITE_API_URL || "";

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

export const fetchAdvisorReply = async ({ message }) => {
  const token = localStorage.getItem("token");

  if (!token) {
    throw new Error("Please log in to use the advisor.");
  }

  const session = await createChatSession(token);
  const updatedSession = await sendChatMessage({
    token,
    sessionId: session.id,
    message,
  });

  return updatedSession.messages[updatedSession.messages.length - 1]?.text || "";
};
