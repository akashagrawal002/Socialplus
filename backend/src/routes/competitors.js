const express = require('express');
const { body, validationResult } = require('express-validator');
const { authenticate, checkAICredits } = require('../middleware/auth');
const { query } = require('../config/database');
const { callAI, callAllAIs, PROMPTS } = require('../services/aiService');
const { getCache, setCache } = require('../config/redis');

const router = express.Router();
router.use(authenticate);

router.get('/', async (req, res) => {
  const { workspace_id } = req.query;
  if (!workspace_id) return res.status(400).json({ success: false, error: 'workspace_id required' });
  try {
    const result = await query(`SELECT * FROM competitors WHERE workspace_id = $1 ORDER BY created_at DESC`, [workspace_id]);
    res.json({ success: true, competitors: result.rows });
  } catch (err) { res.status(500).json({ success: false, error: 'Failed to fetch competitors.' }); }
});

router.post('/detect', checkAICredits,
  [body('workspace_id').notEmpty(), body('biz_name').notEmpty(), body('industry').notEmpty()],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });
    const { workspace_id, biz_name, industry, location, size, provider = 'claude', compare = false } = req.body;
    const cacheKey = `comp_detect:${biz_name}:${industry}:${location}:${provider}`.toLowerCase().replace(/\s/g,'_');
    if (!compare) {
      const cached = await getCache(cacheKey);
      if (cached) return res.json({ success: true, result: cached.result, cached: true });
    }
    try {
      const sys = 'You are a world-class social media strategist and competitive intelligence expert.';
      const msg = PROMPTS.detectCompetitors({ bizName: biz_name, industry, location, size });
      let result, tokensUsed;
      if (compare) {
        const data = await callAllAIs({ systemPrompt: sys, userMessage: msg, userId: req.user.id, action: 'detect_competitors' });
        result = formatCompare(data.results); tokensUsed = data.tokensUsed;
        await query(`INSERT INTO content_generations (workspace_id,user_id,type,topic,result,tokens_used) VALUES ($1,$2,'competitor_detection',$3,$4,$5)`,
          [workspace_id, req.user.id, `${biz_name} - ${industry}`, result, tokensUsed]);
        return res.json({ success: true, result, compare: true, results: data.results });
      }
      const data = await callAI({ provider, systemPrompt: sys, userMessage: msg, userId: req.user.id, action: 'detect_competitors' });
      result = data.result; tokensUsed = data.tokensUsed;
      await query(`INSERT INTO content_generations (workspace_id,user_id,type,topic,result,tokens_used) VALUES ($1,$2,'competitor_detection',$3,$4,$5)`,
        [workspace_id, req.user.id, `${biz_name} - ${industry}`, result, tokensUsed]);
      await setCache(cacheKey, { result }, 86400);
      res.json({ success: true, result, provider });
    } catch (err) { res.status(500).json({ success: false, error: err.message }); }
  }
);

router.post('/analyze', checkAICredits,
  [body('workspace_id').notEmpty(), body('handle').notEmpty()],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });
    const { workspace_id, handle, platform = 'Instagram', focus = 'Full Analysis', provider = 'claude', compare = false } = req.body;
    const cacheKey = `comp_analyze:${handle}:${platform}:${focus}:${provider}`.toLowerCase().replace(/\s/g,'_');
    if (!compare) {
      const cached = await getCache(cacheKey);
      if (cached) return res.json({ success: true, result: cached.result, cached: true });
    }
    try {
      const sys = 'You are an elite social media analyst with expertise in competitive intelligence.';
      const msg = PROMPTS.analyzeCompetitor({ handle, platform, focus });
      let result, tokensUsed;
      if (compare) {
        const data = await callAllAIs({ systemPrompt: sys, userMessage: msg, userId: req.user.id, action: 'analyze_competitor' });
        result = formatCompare(data.results); tokensUsed = data.tokensUsed;
        await query(`INSERT INTO content_generations (workspace_id,user_id,type,platform,topic,result,tokens_used) VALUES ($1,$2,'competitor_analysis',$3,$4,$5,$6)`,
          [workspace_id, req.user.id, platform, handle, result, tokensUsed]);
        return res.json({ success: true, result, compare: true, results: data.results });
      }
      const data = await callAI({ provider, systemPrompt: sys, userMessage: msg, userId: req.user.id, action: 'analyze_competitor' });
      result = data.result; tokensUsed = data.tokensUsed;
      await query(`INSERT INTO content_generations (workspace_id,user_id,type,platform,topic,result,tokens_used) VALUES ($1,$2,'competitor_analysis',$3,$4,$5,$6)`,
        [workspace_id, req.user.id, platform, handle, result, tokensUsed]);
      await setCache(cacheKey, { result }, 43200);
      res.json({ success: true, result, provider });
    } catch (err) { res.status(500).json({ success: false, error: err.message }); }
  }
);

router.post('/gaps', checkAICredits,
  [body('workspace_id').notEmpty(), body('input').notEmpty()],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });
    const { workspace_id, input, provider = 'claude', compare = false } = req.body;
    try {
      const sys = 'You are a world-class content strategist specializing in competitive gap analysis.';
      const msg = PROMPTS.contentGaps({ input });
      let result, tokensUsed;
      if (compare) {
        const data = await callAllAIs({ systemPrompt: sys, userMessage: msg, userId: req.user.id, action: 'content_gaps' });
        result = formatCompare(data.results); tokensUsed = data.tokensUsed;
        await query(`INSERT INTO content_generations (workspace_id,user_id,type,topic,result,tokens_used) VALUES ($1,$2,'content_gaps',$3,$4,$5)`,
          [workspace_id, req.user.id, input, result, tokensUsed]);
        return res.json({ success: true, result, compare: true, results: data.results });
      }
      const data = await callAI({ provider, systemPrompt: sys, userMessage: msg, userId: req.user.id, action: 'content_gaps' });
      result = data.result; tokensUsed = data.tokensUsed;
      await query(`INSERT INTO content_generations (workspace_id,user_id,type,topic,result,tokens_used) VALUES ($1,$2,'content_gaps',$3,$4,$5)`,
        [workspace_id, req.user.id, input, result, tokensUsed]);
      res.json({ success: true, result, provider });
    } catch (err) { res.status(500).json({ success: false, error: err.message }); }
  }
);

router.delete('/:id', async (req, res) => {
  try {
    await query(`DELETE FROM competitors WHERE id = $1 AND workspace_id IN (SELECT id FROM workspaces WHERE user_id = $2)`, [req.params.id, req.user.id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ success: false, error: 'Delete failed.' }); }
});

function formatCompare(results) {
  return `${'═'.repeat(60)}\n🤖 CLAUDE (Anthropic)\n${'═'.repeat(60)}\n${results.claude}\n\n${'═'.repeat(60)}\n💬 CHATGPT (OpenAI GPT-4o)\n${'═'.repeat(60)}\n${results.chatgpt}\n\n${'═'.repeat(60)}\n✨ GEMINI (Google Gemini 1.5 Pro)\n${'═'.repeat(60)}\n${results.gemini}`;
}

module.exports = router;
