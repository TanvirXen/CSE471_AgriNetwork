const { URL } = require("url");

const DEFAULT_FRONTEND_ORIGINS = [
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "http://[::1]:5173",
];

const DEFAULT_TRUSTED_EXTERNAL_ORIGINS = [
  "https://sandbox.sslcommerz.com",
  "https://securepay.sslcommerz.com",
];

const DEFAULT_DEV_PORTS = new Set(["5173", "4173"]);

const normalizeOrigin = (value) => {
  if (!value || typeof value !== "string") return null;

  try {
    return new URL(value).origin;
  } catch (_err) {
    return null;
  }
};

const isPrivateIpv4Hostname = (hostname) => {
  if (!hostname || typeof hostname !== "string") return false;

  if (/^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(hostname)) return true;
  if (/^192\.168\.\d{1,3}\.\d{1,3}$/.test(hostname)) return true;

  const match = hostname.match(/^172\.(\d{1,3})\.\d{1,3}\.\d{1,3}$/);
  if (!match) return false;

  const secondOctet = Number(match[1]);
  return secondOctet >= 16 && secondOctet <= 31;
};

const isDevelopmentNetworkOrigin = (origin) => {
  const normalizedOrigin = normalizeOrigin(origin);
  if (!normalizedOrigin) return false;

  try {
    const parsed = new URL(normalizedOrigin);
    const hostname = parsed.hostname;
    const port = parsed.port || (parsed.protocol === "https:" ? "443" : "80");

    if (hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1") {
      return DEFAULT_DEV_PORTS.has(port);
    }

    return isPrivateIpv4Hostname(hostname) && DEFAULT_DEV_PORTS.has(port);
  } catch (_err) {
    return false;
  }
};

const getExplicitFrontendOrigins = () => {
  const configuredOrigins = [
    process.env.FRONTEND_URL,
    ...(process.env.FRONTEND_URLS || "")
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean),
  ];

  const normalizedOrigins = configuredOrigins
    .map(normalizeOrigin)
    .filter(Boolean);

  return Array.from(new Set([...DEFAULT_FRONTEND_ORIGINS, ...normalizedOrigins]));
};

const getTrustedExternalOrigins = () => {
  const configuredOrigins = (process.env.TRUSTED_EXTERNAL_ORIGINS || "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean)
    .map(normalizeOrigin)
    .filter(Boolean);

  return Array.from(new Set([...DEFAULT_TRUSTED_EXTERNAL_ORIGINS, ...configuredOrigins]));
};

const isAllowedFrontendOrigin = (origin) => {
  if (!origin) return true;
  if (origin === "null") return true;

  const normalizedOrigin = normalizeOrigin(origin);
  if (!normalizedOrigin) return false;

  if (getExplicitFrontendOrigins().includes(normalizedOrigin)) {
    return true;
  }

  if (getTrustedExternalOrigins().includes(normalizedOrigin)) {
    return true;
  }

  return process.env.NODE_ENV !== "production" && isDevelopmentNetworkOrigin(normalizedOrigin);
};

const getPreferredFrontendOrigin = (...candidates) => {
  for (const candidate of candidates) {
    const normalizedOrigin = normalizeOrigin(candidate);
    if (normalizedOrigin && isAllowedFrontendOrigin(normalizedOrigin)) {
      return normalizedOrigin;
    }
  }

  return getExplicitFrontendOrigins()[0] || null;
};

const buildCorsOriginHandler = () => (origin, callback) => {
  if (isAllowedFrontendOrigin(origin)) {
    callback(null, true);
    return;
  }

  callback(new Error(`Origin not allowed by CORS: ${origin}`));
};

module.exports = {
  buildCorsOriginHandler,
  getExplicitFrontendOrigins,
  getPreferredFrontendOrigin,
  getTrustedExternalOrigins,
  isAllowedFrontendOrigin,
};
