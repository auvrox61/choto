import { Router } from 'express';
import { config } from '../config.js';
import { createLink } from '../db.js';
import { cache } from '../cacheInstance.js';
import { validateUrl } from '../validate.js';

export const linksRouter = Router();

linksRouter.post('/', async (req, res, next) => {
  try {
    const host = req.get('host');
    const reqOrigin = host ? `${req.protocol}://${host}` : null;
    const currentHost = req.hostname || config.ownHost;

    const v = validateUrl(req.body?.url, currentHost);
    if (!v.ok) {
      return res.status(400).json({
        error: {
          code: 'INVALID_URL',
          message: 'Enter a full link starting with http:// or https:// (up to 2048 characters).',
        },
      });
    }

    // Determine base URL:
    // If config.baseUrl is localhost while accessed via a real domain,
    // or if config.baseUrl points to a different onrender domain than the actual host,
    // automatically use the incoming request origin so links always point to the real running server.
    let baseUrl = config.baseUrl;
    if (reqOrigin) {
      if (
        config.baseUrl.includes('localhost') ||
        (config.baseUrl.includes('onrender.com') && !config.baseUrl.includes(host))
      ) {
        baseUrl = reqOrigin;
      }
    }

    const code = await createLink(v.url);
    cache.set(code, v.url);
    res.status(201).json({ code, shortUrl: `${baseUrl}/${code}`, longUrl: v.url });
  } catch (err) {
    next(err);
  }
});
