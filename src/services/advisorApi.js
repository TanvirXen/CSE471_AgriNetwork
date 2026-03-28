const API_BASE_URL = import.meta.env.VITE_API_URL || "";

export const fetchAdvisorReply = async ({ message, history = [] }) => {
  const response = await fetch(`${API_BASE_URL}/api/chatbot/reply`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ message, history }),
  });

  let payload = {};
  try {
    payload = await response.json();
  } catch {
    payload = {};
  }

  if (!response.ok) {
    throw new Error(payload.message || "Failed to get advisor response.");
  }

  return payload.reply || "";
};
