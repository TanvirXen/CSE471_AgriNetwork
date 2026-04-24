const https = require("https");

const SANDBOX_BASE_URL = "https://sandbox.sslcommerz.com";
const LIVE_BASE_URL = "https://securepay.sslcommerz.com";
const MOCK_SESSION_PREFIX = "mock-session-";
const MOCK_VAL_ID_PREFIX = "MOCK-";

const getCredentials = () => ({
  storeId: process.env.SSLCOMMERZ_STORE_ID,
  storePassword: process.env.SSLCOMMERZ_STORE_PASSWORD,
});

const isMockMode = () =>
  String(process.env.SSLCOMMERZ_MOCK_MODE || "").toLowerCase() === "true" &&
  String(process.env.NODE_ENV || "").toLowerCase() !== "production";

const isConfigured = () => {
  const { storeId, storePassword } = getCredentials();
  return Boolean(storeId && storePassword);
};

const isReady = () => isConfigured() || isMockMode();

const assertConfigured = () => {
  if (!isReady()) {
    throw new Error(
      "SSLCommerz is not configured. Set SSLCOMMERZ_STORE_ID and SSLCOMMERZ_STORE_PASSWORD, or enable SSLCOMMERZ_MOCK_MODE for local development."
    );
  }
};

const getBaseUrl = () => (process.env.SSLCOMMERZ_IS_LIVE === "true" ? LIVE_BASE_URL : SANDBOX_BASE_URL);

const parseJsonResponse = (text) => {
  try {
    return JSON.parse(text);
  } catch (_err) {
    throw new Error(`Invalid JSON received from SSLCommerz: ${text}`);
  }
};

const requestJson = (requestUrl, { method = "GET", body, headers = {} } = {}) =>
  new Promise((resolve, reject) => {
    const targetUrl = new URL(requestUrl);
    const req = https.request(
      {
        protocol: targetUrl.protocol,
        hostname: targetUrl.hostname,
        path: `${targetUrl.pathname}${targetUrl.search}`,
        method,
        headers: {
          ...headers,
          ...(body ? { "Content-Length": Buffer.byteLength(body) } : {}),
        },
      },
      (res) => {
        let data = "";

        res.on("data", (chunk) => {
          data += chunk;
        });

        res.on("end", () => {
          if (!res.statusCode || res.statusCode < 200 || res.statusCode >= 300) {
            return reject(new Error(`SSLCommerz request failed with status ${res.statusCode}: ${data}`));
          }

          try {
            resolve(parseJsonResponse(data));
          } catch (err) {
            reject(err);
          }
        });
      }
    );

    req.on("error", reject);

    if (body) {
      req.write(body);
    }

    req.end();
  });

const buildFormBody = (payload) => {
  const formData = new URLSearchParams();

  Object.entries(payload).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;
    formData.append(key, String(value));
  });

  return formData.toString();
};

exports.isConfigured = isConfigured;
exports.isMockMode = isMockMode;
exports.isReady = isReady;

const buildMockValidationResponse = ({ valId, tranId, amount, currency = "BDT" }) => ({
  status: "VALID",
  tran_id: tranId,
  amount: Number(amount).toFixed(2),
  currency,
  val_id: valId || `${MOCK_VAL_ID_PREFIX}${tranId}`,
  store_amount: Number(amount).toFixed(2),
  sessionkey: `${MOCK_SESSION_PREFIX}${tranId}`,
  risk_level: "0",
});

exports.buildMockValidationResponse = buildMockValidationResponse;

exports.initiateSession = async (payload) => {
  if (!isConfigured() && isMockMode()) {
    const mockGatewayUrl = new URL(payload.success_url);
    mockGatewayUrl.searchParams.set("tran_id", payload.tran_id);
    mockGatewayUrl.searchParams.set("val_id", `${MOCK_VAL_ID_PREFIX}${payload.tran_id}`);
    mockGatewayUrl.searchParams.set("status", "VALID");
    mockGatewayUrl.searchParams.set("amount", String(payload.total_amount));
    mockGatewayUrl.searchParams.set("currency", payload.currency || "BDT");
    mockGatewayUrl.searchParams.set("sessionkey", `${MOCK_SESSION_PREFIX}${payload.tran_id}`);

    return {
      status: "SUCCESS",
      GatewayPageURL: mockGatewayUrl.toString(),
      redirectGatewayURL: mockGatewayUrl.toString(),
      sessionkey: `${MOCK_SESSION_PREFIX}${payload.tran_id}`,
      store_amount: String(payload.total_amount),
      isMock: true,
    };
  }

  assertConfigured();
  const { storeId, storePassword } = getCredentials();

  return requestJson(`${getBaseUrl()}/gwprocess/v4/api.php`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: buildFormBody({
      store_id: storeId,
      store_passwd: storePassword,
      ...payload,
    }),
  });
};

exports.validatePayment = async ({ valId, tranId, amount, currency = "BDT" }) => {
  if (!isConfigured() && isMockMode()) {
    if (!tranId) {
      throw new Error("SSLCommerz validation requires tranId in mock mode.");
    }

    return buildMockValidationResponse({ valId, tranId, amount, currency });
  }

  assertConfigured();
  const { storeId, storePassword } = getCredentials();

  if (valId) {
    const validationUrl = new URL(`${getBaseUrl()}/validator/api/validationserverAPI.php`);
    validationUrl.searchParams.set("val_id", valId);
    validationUrl.searchParams.set("store_id", storeId);
    validationUrl.searchParams.set("store_passwd", storePassword);
    validationUrl.searchParams.set("v", "1");
    validationUrl.searchParams.set("format", "json");
    return requestJson(validationUrl.toString());
  }

  if (tranId) {
    const validationUrl = new URL(`${getBaseUrl()}/validator/api/merchantTransIDvalidationAPI.php`);
    validationUrl.searchParams.set("tran_id", tranId);
    validationUrl.searchParams.set("store_id", storeId);
    validationUrl.searchParams.set("store_passwd", storePassword);
    validationUrl.searchParams.set("format", "json");
    return requestJson(validationUrl.toString());
  }

  throw new Error("SSLCommerz validation requires valId or tranId.");
};
