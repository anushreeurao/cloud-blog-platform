const INVALID_BROWSER_HOSTS = new Set(["0.0.0.0", "::", "[::]"]);
const DEFAULT_LOCAL_ORIGIN = "http://localhost:3000";

export function normalizeBaseUrl(value: string | null | undefined) {
  if (!value) {
    return null;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;

  try {
    const url = new URL(withProtocol);

    if (INVALID_BROWSER_HOSTS.has(url.hostname)) {
      return null;
    }

    return url.origin.replace(/\/$/, "");
  } catch {
    return null;
  }
}

function resolveBrowserOrigin() {
  if (typeof window === "undefined") {
    return null;
  }

  const fromLocation = normalizeBaseUrl(window.location.origin);
  if (fromLocation) {
    return fromLocation;
  }

  if (window.location.hostname === "0.0.0.0") {
    return DEFAULT_LOCAL_ORIGIN;
  }

  return null;
}

function resolveEnvironmentOrigin() {
  const fromSiteUrl = normalizeBaseUrl(process.env.NEXT_PUBLIC_SITE_URL);
  if (fromSiteUrl) {
    return fromSiteUrl;
  }

  const fromVercelUrl = normalizeBaseUrl(process.env.VERCEL_URL);
  if (fromVercelUrl) {
    return fromVercelUrl;
  }

  return null;
}

export function getSiteUrl() {
  return resolveBrowserOrigin() ?? resolveEnvironmentOrigin() ?? DEFAULT_LOCAL_ORIGIN;
}

export function sanitizeInternalPath(path: string | null | undefined, fallback = "/dashboard") {
  if (!path || !path.startsWith("/") || path.startsWith("//")) {
    return fallback;
  }

  return path;
}

export function absoluteUrl(path: string, origin = getSiteUrl()) {
  return `${origin}${path.startsWith("/") ? path : `/${path}`}`;
}

export function getAuthRedirectUrl(path: string, origin?: string) {
  return absoluteUrl(path, origin ?? getSiteUrl());
}
