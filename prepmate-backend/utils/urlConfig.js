const trimTrailingSlash = (value) => String(value || "").replace(/\/+$/, "");
const isProduction = process.env.NODE_ENV === "production";

const getFrontendBaseUrl = () => {
  const raw = (process.env.FRONTEND_URL || "").split(",")[0].trim();
  if (raw) return trimTrailingSlash(raw);
  return isProduction ? "" : "http://localhost:3000";
};

const getBackendBaseUrl = () => {
  const raw = (process.env.BASE_URL || process.env.BACKEND_URL || "").trim();
  if (raw) return trimTrailingSlash(raw);
  return isProduction ? "" : "http://localhost:5000";
};

const getFrontendOrigins = () => {
  const raw = (process.env.FRONTEND_URL || "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);

  const origins = new Set(raw);

  if (!isProduction) {
    origins.add("http://localhost:3000");
    origins.add("http://127.0.0.1:3000");
  }

  return Array.from(origins);
};

module.exports = {
  getFrontendBaseUrl,
  getBackendBaseUrl,
  getFrontendOrigins,
};
