const express = require('express');
const { body, validationResult } = require('express-validator');
const { authenticate, checkAICredits } = require('../middleware/auth');
const { query } = require('../config/database');
const { callAI, callAllAIs, PROMPTS } = require('../services/aiService');

const router = express.Router();
router.use(authenticate);

// ---- POST generate reels ----
router.post('/reels', checkAICredits,
  [body('workspace_id').notEmpty(), body('niche').notEmpty()],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });
    const { workspace_id, niche, goal = 'Go Viral', tone = 'Entertaining & Fun', count = 10, provider = 'claude', compare = false } = req.body;
    try {
      const sys = 'You are a viral content strategist specializing in Instagram Reels.';
      const msg = PROMPTS.reelIdeas({ niche, goal, tone, count });
      let data;
      if (compare) {
        data = await callAllAIs({ systemPrompt: sys, userMessage: msg, userId: req.user.id, action: 'reel_ideas' });
        const result = formatCompare(data.results);
        await saveGen(workspace_id, req.user.id, 'reel_ideas', 'Instagram', niche, result, data.tokensUsed);
        return res.json({ success: true, result, compare: true, results: data.results });
      }
      data = await callAI({ provider, systemPrompt: sys, userMessage: msg, userId: req.user.id, action: 'reel_ideas' });
      await saveGen(workspace_id, req.user.id, 'reel_ideas', 'Instagram', niche, data.result, data.tokensUsed);
      res.json({ success: true, result: data.result, provider });
    } catch (err) { res.status(500).json({ success: false, error: err.message }); }
  }
);

// ---- POST generate post ideas ----
router.post('/posts', checkAICredits,
  [body('workspace_id').notEmpty(), body('topic').notEmpty()],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });
    const { workspace_id, topic, platform = 'Instagram', type = 'Carousel / Swipe', base = 'My niche expertise', provider = 'claude', compare = false } = req.body;
    try {
      const sys = 'You are a social media content strategist expert.';
      const msg = PROMPTS.postIdeas({ topic, platform, type, base });
      let data;
      if (compare) {
        data = await callAllAIs({ systemPrompt: sys, userMessage: msg, userId: req.user.id, action: 'post_ideas' });
        const result = formatCompare(data.results);
        await saveGen(workspace_id, req.user.id, 'post_ideas', platform, topic, result, data.tokensUsed);
        return res.json({ success: true, result, compare: true, results: data.results });
      }
      data = await callAI({ provider, systemPrompt: sys, userMessage: msg, userId: req.user.id, action: 'post_ideas' });
      await saveGen(workspace_id, req.user.id, 'post_ideas', platform, topic, data.result, data.tokensUsed);
      res.json({ success: true, result: data.result, provider });
    } catch (err) { res.status(500).json({ success: false, error: err.message }); }
  }
);

// ---- POST generate hooks ----
router.post('/hooks', checkAICredits,
  [body('workspace_id').notEmpty(), body('topic').notEmpty()],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });
    const { workspace_id, topic, style = 'Curiosity Gap', platform = 'Instagram Caption', provider = 'claude', compare = false } = req.body;
    try {
      const sys = 'You are a copywriting expert who specializes in social media hooks.';
      const msg = PROMPTS.hooks({ topic, style, platform });
      let data;
      if (compare) {
        data = await callAllAIs({ systemPrompt: sys, userMessage: msg, userId: req.user.id, action: 'hooks' });
        const result = formatCompare(data.results);
        await saveGen(workspace_id, req.user.id, 'hooks', platform, topic, result, data.tokensUsed);
        return res.json({ success: true, result, compare: true, results: data.results });
      }
      data = await callAI({ provider, systemPrompt: sys, userMessage: msg, userId: req.user.id, action: 'hooks' });
      await saveGen(workspace_id, req.user.id, 'hooks', platform, topic, data.result, data.tokensUsed);
      res.json({ success: true, result: data.result, provider });
    } catch (err) { res.status(500).json({ success: false, error: err.message }); }
  }
);

// ---- POST full content generation ----
router.post('/generate', checkAICredits,
  [body('workspace_id').notEmpty(), body('topic').notEmpty(), body('content_type').notEmpty()],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });
    const { workspace_id, topic, content_type, audience, context, tone = 'Professional', language = 'English', provider = 'claude', compare = false } = req.body;
    try {
      const sys = 'You are a master content creator and copywriter with expertise across all social media platforms.';
      const msg = PROMPTS.fullContent({ type: content_type, topic, audience, context, tone, language });
      let data;
      if (compare) {
        data = await callAllAIs({ systemPrompt: sys, userMessage: msg, userId: req.user.id, action: 'full_content' });
        const result = formatCompare(data.results);
        await saveGen(workspace_id, req.user.id, content_type, null, topic, result, data.tokensUsed);
        return res.json({ success: true, result, compare: true, results: data.results });
      }
      data = await callAI({ provider, systemPrompt: sys, userMessage: msg, userId: req.user.id, action: 'full_content' });
      await saveGen(workspace_id, req.user.id, content_type, null, topic, data.result, data.tokensUsed);
      res.json({ success: true, result: data.result, provider });
    } catch (err) { res.status(500).json({ success: false, error: err.message }); }
  }
);

// ---- POST video ideas ----
router.post('/videos', checkAICredits,
  [body('workspace_id').notEmpty(), body('niche').notEmpty()],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });
    const { workspace_id, niche, format = 'YouTube Long-form', inspiration = 'Trending topics', count = '10 ideas', provider = 'claude', compare = false } = req.body;
    const prompt = `Generate ${count} YouTube video ideas for a "${niche}" creator. Format: ${format}. Based on: ${inspiration}.
For each: 🎥 SEO Title | 🖼️ Thumbnail concept | ⏱️ Duration | 📖 Structure | 💡 Why it performs | 🔑 5 keywords | 💰 Monetization angle`;
    try {
      const sys = 'You are a YouTube strategist with expertise in viral video concepts.';
      let data;
      if (compare) {
        data = await callAllAIs({ systemPrompt: sys, userMessage: prompt, userId: req.user.id, action: 'video_ideas' });
        const result = formatCompare(data.results);
        await saveGen(workspace_id, req.user.id, 'video_ideas', 'YouTube', niche, result, data.tokensUsed);
        return res.json({ success: true, result, compare: true, results: data.results });
      }
      data = await callAI({ provider, systemPrompt: sys, userMessage: prompt, userId: req.user.id, action: 'video_ideas' });
      await saveGen(workspace_id, req.user.id, 'video_ideas', 'YouTube', niche, data.result, data.tokensUsed);
      res.json({ success: true, result: data.result, provider });
    } catch (err) { res.status(500).json({ success: false, error: err.message }); }
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
         VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
        [workspace_id, generation_id, title, content, content_type, platform, tags]
      );
      if (generation_id) await query('UPDATE content_generations SET is_saved = true WHERE id = $1', [generation_id]);
      res.status(201).json({ success: true, saved: result.rows[0] });
    } catch (err) { res.status(500).json({ success: false, error: 'Failed to save content.' }); }
  }
);

// ---- GET saved content ----
router.get('/saved', async (req, res) => {
  const { workspace_id } = req.query;
  if (!workspace_id) return res.status(400).json({ success: false, error: 'workspace_id required' });
  try {
    const result = await query(`SELECT * FROM saved_content WHERE workspace_id = $1 ORDER BY created_at DESC`, [workspace_id]);
    res.json({ success: true, saved: result.rows });
  } catch (err) { res.status(500).json({ success: false, error: 'Failed to fetch saved content.' }); }
});

// ---- HELPERS ----
async function saveGen(wsId, userId, type, platform, topic, result, tokens) {
  await query(
    `INSERT INTO content_generations (workspace_id, user_id, type, platform, topic, result, tokens_used)
     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [wsId, userId, type, platform, topic, result, tokens]
  );
}

function formatCompare(results) {
  return `${'═'.repeat(60)}
🤖 CLAUDE (Anthropic)
${'═'.repeat(60)}
${results.claude}

${'═'.repeat(60)}
💬 CHATGPT (OpenAI GPT-4o)
${'═'.repeat(60)}
${results.chatgpt}

${'═'.repeat(60)}
✨ GEMINI (Google Gemini 1.5 Pro)
${'═'.repeat(60)}
${results.gemini}`;
}

module.exports = router;
