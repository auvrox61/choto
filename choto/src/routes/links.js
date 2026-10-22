import { Router } from 'express';
import { config } from '../config.js';
import { createLink } from '../db.js';
import { cache } from '../cacheInstance.js';
import { validateUrl } from '../validate.js';

export const linksRouter = Router();

linksRouter.post('/', async (req, res, next) => {
  try {
    const v = validateUrl(req.body?.url, config.ownHost);
    if (!v.ok) {
      return res.status(400).json({
        error: {
          code: 'INVALID_URL',
          message: 'Enter a full link starting with http:// or https:// (up to 2048 characters).',
        },
      });
    }
    const code = await createLink(v.url);
    cache.set(code, v.url);
    res.status(201).json({ code, shortUrl: `${config.baseUrl}/${code}`, longUrl: v.url });
  } catch (err) {
    next(err);
  }
});
