const express = require('express');
const { body, validationResult } = require('express-validator');
const { authenticate, checkAICredits } = require('../middleware/auth');
const { query } = require('../config/database');
const { callClaude, PROMPTS } = require('../services/aiService');
const { getCache, setCache } = require('../config/redis');

const router = express.Router();
router.use(authenticate);

// ---- GET trends ----
router.post('/', checkAICredits,
  [body('workspace_id').notEmpty()],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

    const {
      workspace_id,
      niche = '',
      platform = 'All Platforms',
      trend_type = 'all trends'
    } = req.body;

    const cacheKey = `trends:${niche}:${platform}:${trend_type}`.toLowerCase().replace(/\s/g, '_');

    // Check Redis cache first
    const cached = await getCache(cacheKey);
    if (cached) return res.json({ success: true, result: cached.result, cached: true });

    // Check DB cache
    try {
      const dbCache = await query(
        `SELECT data FROM trends_cache WHERE cache_key = $1 AND expires_at > NOW()`,
        [cacheKey]
      );
      if (dbCache.rows.length) {
        await setCache(cacheKey, { result: dbCache.rows[0].data }, 3600);
        return res.json({ success: true, result: dbCache.rows[0].data, cached: true });
      }
    } catch (_) {}

    try {
      const { result, tokensUsed } = await callClaude({
        systemPrompt: 'You are a social media trend analyst. Provide the most current, specific trend information available.',
        userMessage: PROMPTS.trends({ niche, platform, trendType: trend_type }),
        userId: req.user.id,
        action: 'trends',
        useWebSearch: true
      });

      // Save to DB cache (6 hours)
      await query(
        `INSERT INTO trends_cache (cache_key, niche, platform, trend_type, data, expires_at)
         VALUES ($1, $2, $3, $4, $5, NOW() + INTERVAL '6 hours')
         ON CONFLICT (cache_key) DO UPDATE
         SET data = $5, expires_at = NOW() + INTERVAL '6 hours'`,
        [cacheKey, niche, platform, trend_type, result]
      ).catch(() => {});

      await setCache(cacheKey, { result }, 21600);

      await query(
        `INSERT INTO content_generations (workspace_id, user_id, type, platform, topic, result, tokens_used)
         VALUES ($1, $2, 'trends', $3, $4, $5, $6)`,
        [workspace_id, req.user.id, platform, niche || 'General', result, tokensUsed]
      );

      res.json({ success: true, result });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  }
);

// ---- POST trend → content ----
router.post('/to-content', checkAICredits,
  [body('workspace_id').notEmpty(), body('trend').notEmpty()],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

    const { workspace_id, trend, niche = 'general' } = req.body;

    const prompt = `Transform this trend into content for a "${niche}" creator:
TREND: "${trend}"

Create:
🎬 REEL CONCEPT — Hook (first 3 sec), structure, CTA, audio direction, caption + hashtags
📱 INSTAGRAM POST — Full caption + 20 hashtags
🎥 YOUTUBE SHORT — Title + script outline
💡 3 UNIQUE ANGLES to stand out vs everyone else using this trend
⏰ URGENCY METER — How many days before this trend peaks?`;

    try {
      const { result, tokensUsed } = await callClaude({
        systemPrompt: 'You are a viral content strategist who turns trends into niche-specific content.',
        userMessage: prompt,
        userId: req.user.id,
        action: 'trend_to_content'
      });

      await query(
        `INSERT INTO content_generations (workspace_id, user_id, type, topic, result, tokens_used)
         VALUES ($1, $2, 'trend_content', $3, $4, $5)`,
        [workspace_id, req.user.id, trend, result, tokensUsed]
      );

      res.json({ success: true, result });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  }
);

module.exports = router;
