import { envConfig } from "../config/env";

const DEFAULT_API_BASE_PATH = "/api";

const trimTrailingSlash = (value: string) => value.replace(/\/+$/, "");

const normalizeApiBaseUrl = (value: string | undefined) => {
  const trimmed = (value || "").trim();
  if (!trimmed) {
    return DEFAULT_API_BASE_PATH;
  }

  const withoutTrailingSlash = trimTrailingSlash(trimmed);
  if (/^https?:\/\//i.test(withoutTrailingSlash)) {
    return withoutTrailingSlash;
  }

  if (withoutTrailingSlash.startsWith("/")) {
    return withoutTrailingSlash;
  }

  return `/${withoutTrailingSlash}`;
};

// Decide API base URL via centralized env config
let rawBaseUrl = envConfig.apiBaseUrl || DEFAULT_API_BASE_PATH;

const normalizedBaseUrl = normalizeApiBaseUrl(rawBaseUrl);
const baseUrl = new URL(normalizedBaseUrl, window.location.origin);
const apiBasePath = trimTrailingSlash(baseUrl.pathname) || DEFAULT_API_BASE_PATH;

const ABSOLUTE_URL_PATTERN = /^[a-zA-Z][a-zA-Z\d+\-.]*:/;
const STATIC_ASSET_PATTERN =
  /\.(png|jpe?g|gif|webp|svg|ico|css|js|mjs|json|woff2?|ttf|eot|map|glb|gltf|mp3|mp4|wav|ogg)$/i;

const isAbsoluteUrl = (url: string) => ABSOLUTE_URL_PATTERN.test(url) || url.startsWith("//");

const normalizeRequestPath = (path: string) => {
  if (!path) {
    return "/";
  }

  return path.startsWith("/") ? path : `/${path}`;
};

const isStaticAssetPath = (path: string) => {
  const pathWithoutQuery = path.split("?")[0];
  return STATIC_ASSET_PATTERN.test(pathWithoutQuery);
};

const resolveApiUrl = (input: string) => {
  if (isAbsoluteUrl(input)) {
    return input;
  }

  const normalizedPath = normalizeRequestPath(input);

  // Keep static assets on the frontend origin.
  if (isStaticAssetPath(normalizedPath)) {
    return `${window.location.origin}${normalizedPath}`;
  }

  // Preserve explicit /api and backend health URLs on backend origin.
  if (normalizedPath.startsWith("/api") || normalizedPath.startsWith("/health")) {
    return `${baseUrl.origin}${normalizedPath}`;
  }

  return `${baseUrl.origin}${apiBasePath}${normalizedPath}`;
};

const isApiRequestUrl = (url: string) => {
  const normalizedApiRoot = `${baseUrl.origin}${apiBasePath}`;
  return url.startsWith(normalizedApiRoot) || url.startsWith(`${baseUrl.origin}/api`) || url.startsWith(`${baseUrl.origin}/health`);
};

const buildHeaders = (existingHeaders: HeadersInit | undefined, shouldAttachAuth: boolean, init: RequestInit) => {
  const headers = new Headers(existingHeaders || {});

  if (shouldAttachAuth && !headers.has("Authorization")) {
    const token = localStorage.getItem("token");
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }
  }

  const method = (init.method || "GET").toUpperCase();
  const hasBody = init.body !== undefined && init.body !== null;
  const isFormDataBody = typeof FormData !== "undefined" && init.body instanceof FormData;

  if (
    shouldAttachAuth &&
    hasBody &&
    !isFormDataBody &&
    method !== "GET" &&
    method !== "HEAD" &&
    !headers.has("Content-Type")
  ) {
    headers.set("Content-Type", "application/json");
  }

  return headers;
};

export class ApiError extends Error {
  public status: number;
  public payload: unknown;

  constructor(message: string, status: number, payload?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.payload = payload;
  }
}

const parseResponsePayload = async (response: Response) => {
  const contentType = response.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    return response.json();
  }

  const text = await response.text();
  return text || null;
};

export const getApiBaseUrl = () => `${baseUrl.origin}${apiBasePath}`;

export const getApiOrigin = () => baseUrl.origin;

export const getApiOriginUrl = (path = "") => {
  if (!path) {
    return baseUrl.origin;
  }

  const normalizedPath = normalizeRequestPath(path);
  return `${baseUrl.origin}${normalizedPath}`;
};

export const getApiUrl = (path: string) => resolveApiUrl(path);

export const apiFetch = async (
  input: string | URL,
  init: RequestInit = {}
): Promise<Response> => {
  const rawInput = typeof input === "string" ? input : input.toString();
  const resolvedUrl = resolveApiUrl(rawInput);
  const shouldAttachAuth = isApiRequestUrl(resolvedUrl);

  const headers = buildHeaders(init.headers, shouldAttachAuth, init);

  return fetch(resolvedUrl, {
    ...init,
    headers,
  });
};

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await apiFetch(path, init);
  const payload = await parseResponsePayload(response);

  if (!response.ok) {
    const message =
      (typeof payload === "object" && payload && "message" in payload
        ? String((payload as { message?: unknown }).message)
        : null) || `Request failed with status ${response.status}`;

    throw new ApiError(message, response.status, payload);
  }

  return payload as T;
}

export const apiClient = {
  fetch: apiFetch,
  request,
  get: <T>(path: string, init: RequestInit = {}) => request<T>(path, { ...init, method: "GET" }),
  post: <T>(path: string, body?: unknown, init: RequestInit = {}) =>
    request<T>(path, {
      ...init,
      method: "POST",
      body: body === undefined ? init.body : JSON.stringify(body),
    }),
  put: <T>(path: string, body?: unknown, init: RequestInit = {}) =>
    request<T>(path, {
      ...init,
      method: "PUT",
      body: body === undefined ? init.body : JSON.stringify(body),
    }),
  patch: <T>(path: string, body?: unknown, init: RequestInit = {}) =>
    request<T>(path, {
      ...init,
      method: "PATCH",
      body: body === undefined ? init.body : JSON.stringify(body),
    }),
  delete: <T>(path: string, init: RequestInit = {}) =>
    request<T>(path, {
      ...init,
      method: "DELETE",
    }),
  getApiBaseUrl,
  getApiOrigin,
  getApiOriginUrl,
  getApiUrl,
};
