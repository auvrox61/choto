import { LRU } from './cache.js';
import { config } from './config.js';

export const cache = new LRU(config.cacheMax, config.cacheTtlMs);
