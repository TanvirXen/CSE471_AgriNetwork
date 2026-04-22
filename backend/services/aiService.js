/**
 * aiService.js
 * Hugging Face Inference API – free tier (personal account, no org needed)
 * Model: mistralai/Mistral-7B-Instruct-v0.2
 * Falls back gracefully when HF_API_KEY is missing or rate-limited.
 */

const HF_API_KEY = process.env.HF_API_KEY;
const HF_MODEL   = "mistralai/Mistral-7B-Instruct-v0.2";
const HF_URL     = `https://api-inference.huggingface.co/models/${HF_MODEL}`;

// Generic HF call with timeout
async function callHF(prompt, maxTokens = 200) {
  if (!HF_API_KEY) {
    console.warn("[aiService] HF_API_KEY not set – AI features will use fallback.");
    return null;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000); // 15s timeout

  try {
    const res = await fetch(HF_URL, {
      method:  "POST",
      headers: {
        Authorization:  `Bearer ${HF_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        inputs: prompt,
        parameters: {
          max_new_tokens:  maxTokens,
          temperature:     0.6,
          return_full_text: false,
          do_sample:       true,
        },
        options: { wait_for_model: true },
      }),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!res.ok) {
      const errText = await res.text();
      console.warn("[aiService] HF API error:", res.status, errText);
      return null;
    }

    const data = await res.json();
    if (Array.isArray(data) && data[0]?.generated_text) {
      return data[0].generated_text.trim();
    }
    return null;
  } catch (err) {
    clearTimeout(timeout);
    if (err.name === "AbortError") {
      console.warn("[aiService] HF request timed out.");
    } else {
      console.warn("[aiService] Error calling HF:", err.message);
    }
    return null;
  }
}

/**
 * Get AI crop insight text for a specific crop.
 * Returns a 1-2 sentence actionable insight, or null on failure.
 */
async function getCropInsight(cropName, variety, season, region, weatherSummary) {
  const prompt = `<s>[INST] You are an expert agricultural advisor for Bangladesh. In exactly 2 sentences, explain why ${cropName} (${variety}) is a good crop choice for the ${season} season in ${region} given this current weather: ${weatherSummary}. Be specific with numbers if possible. [/INST]`;

  const text = await callHF(prompt, 120);
  return text;
}

/**
 * Get AI risk assessment for an escrow transaction.
 * Returns { riskLevel, riskScore, riskReason } or a safe fallback.
 */
async function getEscrowRisk(escrowData) {
  const { amountHeld, product, buyerName, sellerName, status, fundedDaysAgo } = escrowData;

  const prompt = `<s>[INST] You are a financial risk analyst for an agricultural marketplace escrow system in Bangladesh. Analyze this transaction and respond in this exact JSON format only, no explanation:
{"riskLevel":"Low","riskScore":15,"riskReason":"Brief 10-word reason"}

Transaction details:
- Product: ${product || "Agricultural goods"}
- Amount: ৳${amountHeld || 0} BDT
- Buyer: ${buyerName || "Unknown"}
- Seller: ${sellerName || "Unknown"}
- Status: ${status || "Funded"}
- Days since funded: ${fundedDaysAgo || 0}

Risk levels: Low (0-33), Medium (34-66), High (67-100). Higher amount = higher risk. Long pending = higher risk. Disputed = High. [/INST]`;

  const text = await callHF(prompt, 80);

  if (text) {
    try {
      // Extract JSON from response
      const jsonMatch = text.match(/\{[^}]+\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        if (parsed.riskLevel && parsed.riskScore !== undefined) {
          return {
            riskLevel:  parsed.riskLevel,
            riskScore:  Math.min(100, Math.max(0, Number(parsed.riskScore))),
            riskReason: parsed.riskReason || "AI assessment completed.",
            aiPowered:  true,
          };
        }
      }
    } catch {
      // JSON parse failed, use rule-based fallback below
    }
  }

  // Rule-based fallback (never null – never crashes)
  return getRuleBasedRisk(escrowData);
}

function getRuleBasedRisk({ amountHeld, status, fundedDaysAgo, disputeOpened }) {
  let score = 10;
  let reason = "Transaction looks standard.";

  if (amountHeld > 20000)  { score += 25; reason = "High-value transaction warrants monitoring."; }
  if (amountHeld > 50000)  { score += 20; reason = "Very high value – verify both parties."; }
  if (disputeOpened)       { score += 40; reason = "Active dispute detected – review urgently."; }
  if (fundedDaysAgo > 7)   { score += 15; reason = "Funds held over 7 days – follow up on delivery."; }
  if (status === "Disputed") score = Math.max(score, 70);
  if (status === "Released") score = Math.min(score, 20);

  score = Math.min(100, score);
  const level = score >= 67 ? "High" : score >= 34 ? "Medium" : "Low";

  return { riskLevel: level, riskScore: score, riskReason: reason, aiPowered: false };
}

module.exports = { getCropInsight, getEscrowRisk, getRuleBasedRisk };
