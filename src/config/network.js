const trimTrailingSlash = (value = "") => value.replace(/\/+$/, "");

const getBrowserOrigin = () =>
  typeof window !== "undefined" ? window.location.origin : "";

const configuredApiBaseUrl = trimTrailingSlash(import.meta.env.VITE_API_URL || "");
const configuredSocketUrl = trimTrailingSlash(
  import.meta.env.VITE_SOCKET_URL || configuredApiBaseUrl
);

export const API_BASE_URL = configuredApiBaseUrl || getBrowserOrigin();
export const SOCKET_URL = configuredSocketUrl || API_BASE_URL || getBrowserOrigin();

export const buildApiUrl = (path = "") => `${API_BASE_URL}${path}`;

export const buildMediaUrl = (path = "") => {
  if (!path) return "";
  if (/^https?:\/\//i.test(path)) return path;
  return `${API_BASE_URL}${path}`;
};
