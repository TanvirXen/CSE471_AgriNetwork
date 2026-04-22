const https = require("https");

const SANDBOX_BASE_URL = "https://sandbox.sslcommerz.com";
const LIVE_BASE_URL = "https://securepay.sslcommerz.com";

const getCredentials = () => ({
  storeId: process.env.SSLCOMMERZ_STORE_ID,
  storePassword: process.env.SSLCOMMERZ_STORE_PASSWORD,
});

const isConfigured = () => {
  const { storeId, storePassword } = getCredentials();
  return Boolean(storeId && storePassword);
};

const assertConfigured = () => {
  if (!isConfigured()) {
    throw new Error("SSLCommerz is not configured. Set SSLCOMMERZ_STORE_ID and SSLCOMMERZ_STORE_PASSWORD.");
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

exports.initiateSession = async (payload) => {
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

exports.validatePayment = async ({ valId, tranId }) => {
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
