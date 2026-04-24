const trimTrailingSlash = (value = "") => value.replace(/\/+$/, "");

const getBrowserOrigin = () =>
  typeof window !== "undefined" ? window.location.origin : "";

const configuredApiBaseUrl = trimTrailingSlash(import.meta.env.VITE_API_URL || "");
const configuredSocketUrl = trimTrailingSlash(
  import.meta.env.VITE_SOCKET_URL || configuredApiBaseUrl
);

export const API_BASE_URL = import.meta.env.DEV ? "" : configuredApiBaseUrl;
export const SOCKET_URL = import.meta.env.DEV
  ? getBrowserOrigin()
  : configuredSocketUrl || getBrowserOrigin();

export const buildApiUrl = (path = "") => `${API_BASE_URL}${path}`;

export const buildMediaUrl = (path = "") => {
  if (!path) return "";
  if (/^https?:\/\//i.test(path)) return path;
  return `${API_BASE_URL}${path}`;
};
