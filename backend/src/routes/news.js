const express = require('express');
const { body, validationResult } = require('express-validator');
const { authenticate, checkAICredits } = require('../middleware/auth');
const { query } = require('../config/database');
const { callClaude, PROMPTS } = require('../services/aiService');
const { getCache, setCache } = require('../config/redis');

const router = express.Router();
router.use(authenticate);

router.post('/', checkAICredits,
  [body('workspace_id').notEmpty()],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

    const {
      workspace_id,
      platform = '',
      topic = '',
      news_type = 'latest news'
    } = req.body;

    const cacheKey = `news:${platform}:${topic}:${news_type}`.toLowerCase().replace(/\s/g, '_');

    const cached = await getCache(cacheKey);
    if (cached) return res.json({ success: true, result: cached.result, cached: true });

    try {
      const dbCache = await query(
        `SELECT data FROM news_cache WHERE cache_key = $1 AND expires_at > NOW()`,
        [cacheKey]
      );
      if (dbCache.rows.length) {
        await setCache(cacheKey, { result: dbCache.rows[0].data }, 1800);
        return res.json({ success: true, result: dbCache.rows[0].data, cached: true });
      }
    } catch (_) {}

    try {
      const { result, tokensUsed } = await callClaude({
        systemPrompt: 'You are a social media industry journalist and analyst with access to the latest news. Provide accurate, current news about social media platforms.',
        userMessage: PROMPTS.news({ platform, topic, newsType: news_type }),
        userId: req.user.id,
        action: 'news',
        useWebSearch: true
      });

      // Cache 3 hours
      await query(
        `INSERT INTO news_cache (cache_key, platform, topic, news_type, data, expires_at)
         VALUES ($1, $2, $3, $4, $5, NOW() + INTERVAL '3 hours')
         ON CONFLICT (cache_key) DO UPDATE
         SET data = $5, expires_at = NOW() + INTERVAL '3 hours'`,
        [cacheKey, platform, topic, news_type, result]
      ).catch(() => {});

      await setCache(cacheKey, { result }, 10800);

      await query(
        `INSERT INTO content_generations (workspace_id, user_id, type, platform, topic, result, tokens_used)
         VALUES ($1, $2, 'news', $3, $4, $5, $6)`,
        [workspace_id, req.user.id, platform || 'All', topic || 'General', result, tokensUsed]
      );

      res.json({ success: true, result });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  }
);

module.exports = router;
