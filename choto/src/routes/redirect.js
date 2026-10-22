import { Router } from 'express';
import { CODE_RE } from '../code.js';
import { findLongUrl } from '../db.js';
import { cache } from '../cacheInstance.js';
import { rateLimit } from '../middleware/rateLimit.js';

export const redirectRouter = Router();

// Loose cap: many people can share one IP (office, mobile carrier NAT).
const limiter = rateLimit({ windowMs: 60_000, max: 600 });

redirectRouter.get(
  '/:code',
  (req, res, next) => (CODE_RE.test(req.params.code) ? next() : next('route')),
  limiter,
  async (req, res, next) => {
    try {
      const { code } = req.params;
      let url = cache.get(code);
      if (!url) {
        url = await findLongUrl(code);
        if (!url) return res.status(404).type('text/plain').send('Link not found');
        cache.set(code, url);
      }
      // 302, not 301: browsers cache 301s forever, which would block deleting links or adding analytics later.
      res.redirect(302, url);
    } catch (err) {
      next(err);
    }
  }
);
