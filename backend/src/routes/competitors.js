const express = require('express');
const { body, validationResult } = require('express-validator');
const { authenticate, checkAICredits } = require('../middleware/auth');
const { query } = require('../config/database');
const { callClaude, PROMPTS } = require('../services/aiService');
const { getCache, setCache } = require('../config/redis');

const router = express.Router();

// All routes require auth
router.use(authenticate);

// ---- GET all competitors for a workspace ----
router.get('/', async (req, res) => {
  const { workspace_id } = req.query;
  if (!workspace_id) return res.status(400).json({ success: false, error: 'workspace_id required' });

  try {
    const result = await query(
      `SELECT * FROM competitors WHERE workspace_id = $1 ORDER BY created_at DESC`,
      [workspace_id]
    );
    res.json({ success: true, competitors: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to fetch competitors.' });
  }
});

// ---- POST auto-detect competitors ----
router.post('/detect', checkAICredits,
  [
    body('workspace_id').notEmpty(),
    body('biz_name').notEmpty(),
    body('industry').notEmpty()
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

    const { workspace_id, biz_name, industry, location, size } = req.body;

    // Cache key
    const cacheKey = `comp_detect:${biz_name}:${industry}:${location}`.toLowerCase().replace(/\s/g, '_');
    const cached = await getCache(cacheKey);
    if (cached) return res.json({ success: true, result: cached.result, cached: true });

    try {
      const systemPrompt = 'You are a world-class social media strategist and competitive intelligence expert.';
      const userMessage = PROMPTS.detectCompetitors({ bizName: biz_name, industry, location, size });

      const { result, tokensUsed } = await callClaude({
        systemPrompt, userMessage,
        userId: req.user.id,
        action: 'detect_competitors'
      });

      // Save to DB
      await query(
        `INSERT INTO content_generations (workspace_id, user_id, type, topic, result, tokens_used)
         VALUES ($1, $2, 'competitor_detection', $3, $4, $5)`,
        [workspace_id, req.user.id, `${biz_name} - ${industry}`, result, tokensUsed]
      );

      // Cache for 24 hours
      await setCache(cacheKey, { result }, 86400);

      res.json({ success: true, result });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  }
);

// ---- POST analyze one competitor ----
router.post('/analyze', checkAICredits,
  [
    body('workspace_id').notEmpty(),
    body('handle').notEmpty()
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

    const { workspace_id, handle, platform = 'Instagram', focus = 'Full Analysis' } = req.body;

    const cacheKey = `comp_analyze:${handle}:${platform}:${focus}`.toLowerCase().replace(/\s/g, '_');
    const cached = await getCache(cacheKey);
    if (cached) return res.json({ success: true, result: cached.result, cached: true });

    try {
      const { result, tokensUsed } = await callClaude({
        systemPrompt: 'You are an elite social media analyst with expertise in competitive intelligence.',
        userMessage: PROMPTS.analyzeCompetitor({ handle, platform, focus }),
        userId: req.user.id,
        action: 'analyze_competitor'
      });

      // Save generation
      await query(
        `INSERT INTO content_generations (workspace_id, user_id, type, platform, topic, result, tokens_used)
         VALUES ($1, $2, 'competitor_analysis', $3, $4, $5, $6)`,
        [workspace_id, req.user.id, platform, handle, result, tokensUsed]
      );

      // Save competitor record
      await query(
        `INSERT INTO competitors (workspace_id, name, handle, platform, analysis_data, last_analyzed_at)
         VALUES ($1, $2, $3, $4, $5, NOW())
         ON CONFLICT (workspace_id, handle, platform) 
         DO UPDATE SET analysis_data = $5, last_analyzed_at = NOW()`,
        [workspace_id, handle, handle, platform, JSON.stringify({ result, analyzedAt: new Date() })]
      ).catch(() => {}); // Ignore if no unique constraint

      await setCache(cacheKey, { result }, 43200); // 12 hours

      res.json({ success: true, result });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  }
);

// ---- POST content gap finder ----
router.post('/gaps', checkAICredits,
  [body('workspace_id').notEmpty(), body('input').notEmpty()],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

    const { workspace_id, input } = req.body;

    try {
      const { result, tokensUsed } = await callClaude({
        systemPrompt: 'You are a world-class content strategist specializing in competitive gap analysis.',
        userMessage: PROMPTS.contentGaps({ input }),
        userId: req.user.id,
        action: 'content_gaps'
      });

      await query(
        `INSERT INTO content_generations (workspace_id, user_id, type, topic, result, tokens_used)
         VALUES ($1, $2, 'content_gaps', $3, $4, $5)`,
        [workspace_id, req.user.id, input, result, tokensUsed]
      );

      res.json({ success: true, result });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  }
);

// ---- DELETE competitor ----
router.delete('/:id', async (req, res) => {
  try {
    await query(
      `DELETE FROM competitors WHERE id = $1 AND workspace_id IN 
       (SELECT id FROM workspaces WHERE user_id = $2)`,
      [req.params.id, req.user.id]
    );
    res.json({ success: true, message: 'Competitor removed.' });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Delete failed.' });
  }
});

module.exports = router;
