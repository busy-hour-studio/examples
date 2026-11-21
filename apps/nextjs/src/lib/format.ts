import type { UserSummary } from "@examples/api";

/** The name to show for an embedded profile. The API sends `null` for a user
 *  who has since been deleted. */
export function displayNameOf(user: UserSummary | null): string {
  return user ? (user.displayName ?? user.externalId) : "Deleted user";
}

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

/** A compact relative time: "now", "5m", "3h", "2d", then a date. */
export function relativeTime(iso: string): string {
  const elapsed = Date.now() - Date.parse(iso);
  if (elapsed < MINUTE) return "now";
  if (elapsed < HOUR) return `${Math.floor(elapsed / MINUTE)}m`;
  if (elapsed < DAY) return `${Math.floor(elapsed / HOUR)}h`;
  if (elapsed < 7 * DAY) return `${Math.floor(elapsed / DAY)}d`;
  return new Date(iso).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
  });
}

/** A sentence-friendly relative time: "just now", "5m ago", or a date. */
export function timeAgo(iso: string): string {
  const compact = relativeTime(iso);
  if (compact === "now") return "just now";
  return /^\d/.test(compact) ? `${compact} ago` : compact;
}

/** A clock time for messages, e.g. "14:05". */
export function clockTime(iso: string): string {
  return new Date(iso).toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Up to two initials, e.g. "Ada Lovelace" → "AL". */
export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const letters =
    parts.length > 1 ? [parts[0], parts.at(-1)] : [name.slice(0, 2)];
  return letters
    .map((part) => part?.charAt(0) ?? "")
    .join("")
    .toUpperCase();
}

/** A stable, warm pastel for a user id, so everyone keeps their colour. */
export function colorFor(id: string): string {
  let hash = 0;
  for (const char of id) hash = (hash * 31 + char.charCodeAt(0)) | 0;
  return `hsl(${Math.abs(hash) % 360} 55% 84%)`;
}
