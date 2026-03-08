const DEFAULT_PRODUCTION_PORTAL_ORIGIN = "https://portal.docduty.com.pk";

function trimTrailingSlash(value: string): string {
  return value.endsWith("/") ? value.slice(0, -1) : value;
}

export function getPortalOrigin(hostname = window.location.hostname): string {
  const envOrigin = import.meta.env.VITE_PORTAL_URL?.trim();
  if (envOrigin) {
    return trimTrailingSlash(envOrigin);
  }

  if (hostname === "127.0.0.1") {
    return "http://127.0.0.1:3000";
  }

  if (hostname === "localhost") {
    return "http://localhost:3000";
  }

  return DEFAULT_PRODUCTION_PORTAL_ORIGIN;
}

export function getPortalLoginUrl(hostname = window.location.hostname): string {
  return `${getPortalOrigin(hostname)}/login`;
}

type PortalRegisterRole = "doctor" | "facility";

export function getPortalRegisterUrl(
  role?: PortalRegisterRole,
  hostname = window.location.hostname,
): string {
  const url = new URL(`${getPortalOrigin(hostname)}/login`);
  url.searchParams.set("mode", "register");

  if (role) {
    url.searchParams.set("role", role);
  }

  return url.toString();
}
