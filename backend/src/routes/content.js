const express = require('express');
const { body, validationResult } = require('express-validator');
const { authenticate, checkAICredits } = require('../middleware/auth');
const { query } = require('../config/database');
const { callClaude, PROMPTS } = require('../services/aiService');

const router = express.Router();
router.use(authenticate);

// ---- POST generate reels ----
router.post('/reels', checkAICredits,
  [body('workspace_id').notEmpty(), body('niche').notEmpty()],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

    const { workspace_id, niche, goal = 'Go Viral', tone = 'Entertaining & Fun', count = 10 } = req.body;

    try {
      const { result, tokensUsed } = await callClaude({
        systemPrompt: 'You are a viral content strategist specializing in Instagram Reels with a proven track record of creating high-performing short video content.',
        userMessage: PROMPTS.reelIdeas({ niche, goal, tone, count }),
        userId: req.user.id,
        action: 'reel_ideas'
      });

      await query(
        `INSERT INTO content_generations (workspace_id, user_id, type, platform, topic, result, tokens_used)
         VALUES ($1, $2, 'reel_ideas', 'Instagram', $3, $4, $5)`,
        [workspace_id, req.user.id, niche, result, tokensUsed]
      );

      res.json({ success: true, result });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  }
);

// ---- POST generate post ideas ----
router.post('/posts', checkAICredits,
  [body('workspace_id').notEmpty(), body('topic').notEmpty()],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

    const {
      workspace_id, topic,
      platform = 'Instagram',
      type = 'Carousel / Swipe',
      base = 'My niche expertise'
    } = req.body;

    try {
      const { result, tokensUsed } = await callClaude({
        systemPrompt: 'You are a social media content strategist expert in creating high-performing posts.',
        userMessage: PROMPTS.postIdeas({ topic, platform, type, base }),
        userId: req.user.id,
        action: 'post_ideas'
      });

      await query(
        `INSERT INTO content_generations (workspace_id, user_id, type, platform, topic, result, tokens_used)
         VALUES ($1, $2, 'post_ideas', $3, $4, $5, $6)`,
        [workspace_id, req.user.id, platform, topic, result, tokensUsed]
      );

      res.json({ success: true, result });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  }
);

// ---- POST generate hooks ----
router.post('/hooks', checkAICredits,
  [body('workspace_id').notEmpty(), body('topic').notEmpty()],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

    const { workspace_id, topic, style = 'Curiosity Gap', platform = 'Instagram Caption' } = req.body;

    try {
      const { result, tokensUsed } = await callClaude({
        systemPrompt: 'You are a copywriting expert who specializes in social media hooks that stop the scroll.',
        userMessage: PROMPTS.hooks({ topic, style, platform }),
        userId: req.user.id,
        action: 'hooks'
      });

      await query(
        `INSERT INTO content_generations (workspace_id, user_id, type, platform, topic, result, tokens_used)
         VALUES ($1, $2, 'hooks', $3, $4, $5, $6)`,
        [workspace_id, req.user.id, platform, topic, result, tokensUsed]
      );

      res.json({ success: true, result });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  }
);

// ---- POST full content generation ----
router.post('/generate', checkAICredits,
  [body('workspace_id').notEmpty(), body('topic').notEmpty(), body('content_type').notEmpty()],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

    const {
      workspace_id, topic,
      content_type, audience, context,
      tone = 'Professional',
      language = 'English'
    } = req.body;

    try {
      const { result, tokensUsed } = await callClaude({
        systemPrompt: 'You are a master content creator and copywriter with expertise across all social media platforms.',
        userMessage: PROMPTS.fullContent({ type: content_type, topic, audience, context, tone, language }),
        userId: req.user.id,
        action: 'full_content'
      });

      await query(
        `INSERT INTO content_generations (workspace_id, user_id, type, topic, result, tokens_used)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [workspace_id, req.user.id, content_type, topic, result, tokensUsed]
      );

      res.json({ success: true, result });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  }
);

// ---- POST video ideas ----
router.post('/videos', checkAICredits,
  [body('workspace_id').notEmpty(), body('niche').notEmpty()],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

    const { workspace_id, niche, format = 'YouTube Long-form', inspiration = 'Trending topics', count = '10 ideas' } = req.body;

    const prompt = `Generate ${count} YouTube video ideas for a "${niche}" creator.
Format: ${format}
Based on: ${inspiration}

For each idea:
🎥 SEO Title | 🖼️ Thumbnail concept | ⏱️ Duration | 📖 Structure (Hook → Intro → Sections → Outro) | 💡 Why it performs | 🔑 5 keywords | 💰 Monetization angle`;

    try {
      const { result, tokensUsed } = await callClaude({
        systemPrompt: 'You are a YouTube strategist with expertise in viral video concepts and channel growth.',
        userMessage: prompt,
        userId: req.user.id,
        action: 'video_ideas'
      });

      await query(
        `INSERT INTO content_generations (workspace_id, user_id, type, platform, topic, result, tokens_used)
         VALUES ($1, $2, 'video_ideas', 'YouTube', $3, $4, $5)`,
        [workspace_id, req.user.id, niche, result, tokensUsed]
      );

      res.json({ success: true, result });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  }
);

// ---- POST save content ----
router.post('/save', authenticate,
  [body('workspace_id').notEmpty(), body('content').notEmpty()],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

    const { workspace_id, generation_id, title, content, content_type, platform, tags } = req.body;

    try {
      const result = await query(
        `INSERT INTO saved_content (workspace_id, generation_id, title, content, content_type, platform, tags)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING *`,
        [workspace_id, generation_id, title, content, content_type, platform, tags]
      );

      // Mark generation as saved
      if (generation_id) {
        await query('UPDATE content_generations SET is_saved = true WHERE id = $1', [generation_id]);
      }

      res.status(201).json({ success: true, saved: result.rows[0] });
    } catch (err) {
      res.status(500).json({ success: false, error: 'Failed to save content.' });
    }
  }
);

// ---- GET saved content ----
router.get('/saved', async (req, res) => {
  const { workspace_id } = req.query;
  if (!workspace_id) return res.status(400).json({ success: false, error: 'workspace_id required' });

  try {
    const result = await query(
      `SELECT * FROM saved_content WHERE workspace_id = $1 ORDER BY created_at DESC`,
      [workspace_id]
    );
    res.json({ success: true, saved: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to fetch saved content.' });
  }
});

module.exports = router;
