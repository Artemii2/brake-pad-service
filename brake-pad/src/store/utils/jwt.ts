function decodePayload(token: string): Record<string, unknown> | null {
  const parts = token.split(".");
  if (parts.length < 2) return null;
  try {
    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const json = atob(base64);
    const parsed = JSON.parse(json) as unknown;
    return parsed && typeof parsed === "object" ? (parsed as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

function parseIsModeratorFromCookie(): boolean {
  if (typeof document === "undefined") return false;
  const cookies = document.cookie || "";
  const parts = cookies.split(";").map((item) => item.trim());
  const roleCookie = parts.find((item) => item.startsWith("role="));
  if (roleCookie) {
    const value = decodeURIComponent(roleCookie.slice("role=".length)).toLowerCase();
    if (value.includes("moderator")) return true;
  }
  const flagCookie = parts.find((item) => item.startsWith("is_moderator="));
  if (!flagCookie) return false;
  const raw = decodeURIComponent(flagCookie.slice("is_moderator=".length)).toLowerCase();
  return raw === "1" || raw === "true" || raw === "yes";
}

export function parseIsModeratorFromToken(token: string): boolean {
  const payload = decodePayload(token);
  if (payload) {
    const value = payload.is_moderator ?? payload.isModerator ?? payload.role;
    if (typeof value === "boolean") return value;
    if (typeof value === "string") return value.toLowerCase().includes("moderator");
  }
  return parseIsModeratorFromCookie();
}

export function parseUsernameFromToken(token: string): string {
  const payload = decodePayload(token);
  if (!payload) return "";
  const candidate =
    payload.sub ??
    payload.login ??
    payload.username ??
    payload.preferred_username ??
    payload.name;
  return typeof candidate === "string" ? candidate.trim() : "";
}
