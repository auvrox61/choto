// Fixed-window per-IP limiter held in memory (per instance).
export function rateLimit({ windowMs, max }) {
  const hits = new Map();

  setInterval(() => {
    const now = Date.now();
    for (const [ip, e] of hits) if (e.reset <= now) hits.delete(ip);
  }, windowMs).unref();

  return (req, res, next) => {
    const now = Date.now();
    let e = hits.get(req.ip);
    if (!e || e.reset <= now) {
      e = { count: 0, reset: now + windowMs };
      hits.set(req.ip, e);
    }
    if (++e.count > max) {
      res.set('Retry-After', String(Math.ceil((e.reset - now) / 1000)));
      return res
        .status(429)
        .json({ error: { code: 'RATE_LIMITED', message: 'Too many requests. Try again in a minute.' } });
    }
    next();
  };
}
