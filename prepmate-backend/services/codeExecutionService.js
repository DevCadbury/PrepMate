const fetch = require("node-fetch");

const SUPPORTED_LANGUAGES = {
  javascript: 63,
  python: 71,
  java: 62,
  cpp: 54,
  c: 50,
};

const STATUS_ID_TO_LABEL = {
  1: "In Queue",
  2: "Processing",
  3: "Accepted",
  4: "Wrong Answer",
  5: "Time Limit Exceeded",
  6: "Compilation Error",
  7: "Runtime Error",
  8: "Runtime Error",
  9: "Runtime Error",
  10: "Runtime Error",
  11: "Runtime Error",
  12: "Runtime Error",
  13: "Internal Error",
  14: "Internal Error",
};

const normalizeLanguage = (language = "") => {
  const value = String(language || "")
    .trim()
    .toLowerCase();

  if (value === "c++" || value === "cpp17" || value === "cpp20") {
    return "cpp";
  }

  if (value === "javascript" || value === "js" || value === "node" || value === "nodejs") {
    return "javascript";
  }

  if (value === "python3" || value === "py") {
    return "python";
  }

  return value;
};

const getJudge0Headers = () => {
  const headers = {
    "Content-Type": "application/json",
  };

  if (process.env.JUDGE0_API_KEY) {
    headers["X-RapidAPI-Key"] = process.env.JUDGE0_API_KEY;
  }

  if (process.env.JUDGE0_API_HOST) {
    headers["X-RapidAPI-Host"] = process.env.JUDGE0_API_HOST;
  }

  return headers;
};

const getJudge0BaseUrl = () => {
  const configuredBaseUrl = (process.env.JUDGE0_BASE_URL || "").trim();
  if (configuredBaseUrl) {
    return configuredBaseUrl.replace(/\/+$/, "");
  }

  // Public Judge0 CE endpoint (sufficient for development/testing).
  return "https://ce.judge0.com";
};

const withTimeout = async (promise, timeoutMs = 20000) => {
  let timeoutHandle;
  const timeoutPromise = new Promise((_, reject) => {
    timeoutHandle = setTimeout(() => {
      reject(new Error("Execution request timed out"));
    }, timeoutMs);
  });

  try {
    const result = await Promise.race([promise, timeoutPromise]);
    clearTimeout(timeoutHandle);
    return result;
  } catch (error) {
    clearTimeout(timeoutHandle);
    throw error;
  }
};

const parseRuntimeMs = (value) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return 0;
  }

  return Math.max(0, Math.round(parsed * 1000));
};

const parseMemoryKb = (value) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return 0;
  }

  return Math.max(0, Math.round(parsed));
};

const resolveStatusLabel = (status) => {
  const statusId = Number(status?.id || status);
  if (STATUS_ID_TO_LABEL[statusId]) {
    return STATUS_ID_TO_LABEL[statusId];
  }

  if (status?.description) {
    return status.description;
  }

  return "Internal Error";
};

const executeCode = async ({
  sourceCode,
  language,
  stdin = "",
  expectedOutput,
  cpuTimeLimit = 2,
  wallTimeLimit = 5,
  memoryLimitKb = 262144,
}) => {
  const normalizedLanguage = normalizeLanguage(language);
  const languageId = SUPPORTED_LANGUAGES[normalizedLanguage];

  if (!languageId) {
    throw new Error(`Unsupported language: ${language}`);
  }

  const payload = {
    source_code: sourceCode,
    language_id: languageId,
    stdin,
    cpu_time_limit: cpuTimeLimit,
    wall_time_limit: wallTimeLimit,
    memory_limit: memoryLimitKb,
    base64_encoded: false,
  };

  if (typeof expectedOutput === "string") {
    payload.expected_output = expectedOutput;
  }

  const endpoint = `${getJudge0BaseUrl()}/submissions?wait=true&base64_encoded=false`;
  const response = await withTimeout(
    fetch(endpoint, {
      method: "POST",
      headers: getJudge0Headers(),
      body: JSON.stringify(payload),
    })
  );

  let data;
  try {
    data = await response.json();
  } catch {
    throw new Error("Invalid execution response from judge service");
  }

  if (!response.ok) {
    const message = data?.error || data?.message || "Code execution failed";
    throw new Error(message);
  }

  return {
    language: normalizedLanguage,
    statusId: Number(data?.status?.id || 13),
    status: resolveStatusLabel(data?.status),
    stdout: data?.stdout || "",
    stderr: data?.stderr || "",
    compileOutput: data?.compile_output || "",
    runtimeMs: parseRuntimeMs(data?.time),
    memoryKb: parseMemoryKb(data?.memory),
    token: data?.token,
  };
};

module.exports = {
  SUPPORTED_LANGUAGES,
  normalizeLanguage,
  executeCode,
};
