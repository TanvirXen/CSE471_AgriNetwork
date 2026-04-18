const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-flash-latest";
const GEMINI_API_BASE = process.env.GEMINI_API_BASE || "https://generativelanguage.googleapis.com/v1beta";

const ADVISOR_SYSTEM_PROMPT = `
You are AgriBot, an agriculture advisor focused on Bangladesh.

Core behavior:
- Give practical, Bangladesh-relevant guidance for farmers, buyers, and agri-traders.
- Prefer local context: Kharif/Rabi/Boro seasons, district weather variation, soil and water conditions, mandi/haat realities, common crops in Bangladesh.
- Use clear, simple language. Keep advice actionable with numbered steps.
- If information is uncertain (for example, exact current market price), state uncertainty and suggest a verification method.
- Prioritize safety: for pesticide/fertilizer guidance, recommend label-compliant use, protective equipment, and local agricultural extension confirmation.
- Do not provide dangerous, illegal, or harmful instructions.
- If user asks non-agri questions, respond briefly and steer back to agriculture support.

Response style:
- Friendly and concise.
- Use short sections when useful: "Quick answer", "What to do now", "Watch-outs".
- Default to Bangla-friendly context and units used in Bangladesh (kg, bigha/acre/hectare when needed).
`.trim();

const CHAT_TITLE_SYSTEM_PROMPT = `
Create a very short chat title for an agriculture support conversation.

Rules:
- Maximum 6 words.
- Do not use quotation marks.
- Prefer title case.
- Focus on the user's main topic.
- If the message is vague, return: General Advice
`.trim();

const sanitizeHistory = (history) => {
  if (!Array.isArray(history)) return [];

  return history
    .filter(
      (item) =>
        item &&
        typeof item.text === "string" &&
        (item.role === "user" || item.role === "assistant")
    )
    .slice(-20)
    .map((item) => ({
      role: item.role === "assistant" ? "model" : "user",
      parts: [{ text: item.text.trim() }],
    }))
    .filter((item) => item.parts[0].text.length > 0);
};

const extractTextFromCandidate = (candidate) =>
  candidate?.content?.parts
    ?.map((part) => part?.text || "")
    .join("")
    .trim() || "";

const generateAdvisorReply = async ({ message, history = [] }) => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is missing in environment.");
  }

  const contents = [
    ...sanitizeHistory(history),
    {
      role: "user",
      parts: [{ text: message.trim() }],
    },
  ];

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20000);

  try {
    const response = await fetch(
      `${GEMINI_API_BASE}/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          systemInstruction: {
            parts: [{ text: ADVISOR_SYSTEM_PROMPT }],
          },
          contents,
          generationConfig: {
            temperature: 0.4,
            topP: 0.9,
            maxOutputTokens: 1600,
          },
        }),
      }
    );

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`Gemini API request failed (${response.status}): ${errorBody}`);
    }

    const data = await response.json();
    const reply = extractTextFromCandidate(data?.candidates?.[0]);

    if (!reply) {
      throw new Error("Gemini returned an empty response.");
    }

    return reply;
  } finally {
    clearTimeout(timeout);
  }
};

const generateChatTitle = async (message) => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return "New Chat";
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);

  try {
    const response = await fetch(
      `${GEMINI_API_BASE}/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          systemInstruction: {
            parts: [{ text: CHAT_TITLE_SYSTEM_PROMPT }],
          },
          contents: [
            {
              role: "user",
              parts: [{ text: message.trim() }],
            },
          ],
          generationConfig: {
            temperature: 0.2,
            topP: 0.8,
            maxOutputTokens: 20,
          },
        }),
      }
    );

    if (!response.ok) {
      return "New Chat";
    }

    const data = await response.json();
    const title = extractTextFromCandidate(data?.candidates?.[0]).replace(/^["']|["']$/g, "");

    return title || "New Chat";
  } catch {
    return "New Chat";
  } finally {
    clearTimeout(timeout);
  }
};

module.exports = { generateAdvisorReply, generateChatTitle };
