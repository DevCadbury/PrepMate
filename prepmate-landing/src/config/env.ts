const isDev = process.env.NODE_ENV === "development";
const isProd = process.env.NODE_ENV === "production";

const getDefaultApiBaseUrl = () => (isDev ? "http://localhost:5000" : "/api");

const apiBaseUrl =
  process.env.REACT_APP_API_BASE_URL ||
  process.env.REACT_APP_API_URL ||
  getDefaultApiBaseUrl();

const frontendUrl = process.env.REACT_APP_FRONTEND_URL || window.location.origin;

export const envConfig = {
  isDev,
  isProd,
  apiBaseUrl,
  frontendUrl,
};
