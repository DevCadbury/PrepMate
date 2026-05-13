const MAX_EVENTS = 25;

const events = [];

const normalizeSeverity = (value) => {
  const severity = String(value || "info").trim().toLowerCase();
  if (["info", "success", "warning", "error"].includes(severity)) {
    return severity;
  }

  return "info";
};

const recordHealthEvent = (type, message, metadata = {}, severity = "info") => {
  const event = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
    type: String(type || "event"),
    message: String(message || ""),
    severity: normalizeSeverity(severity),
    metadata: metadata && typeof metadata === "object" ? metadata : {},
    timestamp: new Date().toISOString(),
  };

  events.unshift(event);
  if (events.length > MAX_EVENTS) {
    events.length = MAX_EVENTS;
  }

  return event;
};

const getHealthEvents = () => [...events];

const clearHealthEvents = () => {
  events.length = 0;
};

module.exports = {
  recordHealthEvent,
  getHealthEvents,
  clearHealthEvents,
};