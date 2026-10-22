export const MAX_URL_LENGTH = 2048;

// Returns { ok: true, url } with a normalized URL, or { ok: false }.
export function validateUrl(input, ownHost) {
  if (typeof input !== 'string') return { ok: false };
  const raw = input.trim();
  if (!raw || raw.length > MAX_URL_LENGTH) return { ok: false };

  let u;
  try {
    u = new URL(raw);
  } catch {
    return { ok: false };
  }

  if (u.protocol !== 'http:' && u.protocol !== 'https:') return { ok: false };
  if (u.username || u.password) return { ok: false };
  if (ownHost && u.hostname.toLowerCase() === ownHost.toLowerCase()) return { ok: false }; // redirect loops
  if (u.href.length > MAX_URL_LENGTH) return { ok: false };
  return { ok: true, url: u.href };
}
