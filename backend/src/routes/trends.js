const express = require('express');
const { body, validationResult } = require('express-validator');
const { authenticate, checkAICredits } = require('../middleware/auth');
const { query } = require('../config/database');
const { callAI, callAllAIs, PROMPTS } = require('../services/aiService');
const { getCache, setCache } = require('../config/redis');

const router = express.Router();
router.use(authenticate);

router.post('/', checkAICredits,
  [body('workspace_id').notEmpty()],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });
    const { workspace_id, niche = '', platform = 'All Platforms', trend_type = 'all trends', provider = 'claude', compare = false } = req.body;
    const cacheKey = `trends:${niche}:${platform}:${trend_type}:${provider}`.toLowerCase().replace(/\s/g,'_');
    if (!compare) {
      const cached = await getCache(cacheKey);
      if (cached) return res.json({ success: true, result: cached.result, cached: true });
    }
    try {
      const sys = 'You are a social media trend analyst with access to current platform data.';
      const msg = PROMPTS.trends({ niche, platform, trendType: trend_type });
      let result, tokensUsed;
      if (compare) {
        const data = await callAllAIs({ systemPrompt: sys, userMessage: msg, userId: req.user.id, action: 'trends' });
        result = formatCompare(data.results); tokensUsed = data.tokensUsed;
        await saveGen(workspace_id, req.user.id, 'trends', platform, niche || 'General', result, tokensUsed);
        return res.json({ success: true, result, compare: true, results: data.results });
      }
      // Use web search only for Claude
      const useWebSearch = provider === 'claude';
      const data = await callAI({ provider, systemPrompt: sys, userMessage: msg, userId: req.user.id, action: 'trends', useWebSearch });
      result = data.result; tokensUsed = data.tokensUsed;
      await query(`INSERT INTO trends_cache (cache_key,niche,platform,trend_type,data,expires_at) VALUES ($1,$2,$3,$4,$5,NOW()+INTERVAL '6 hours') ON CONFLICT(cache_key) DO UPDATE SET data=$5,expires_at=NOW()+INTERVAL '6 hours'`,
        [cacheKey, niche, platform, trend_type, result]).catch(()=>{});
      await setCache(cacheKey, { result }, 21600);
      await saveGen(workspace_id, req.user.id, 'trends', platform, niche || 'General', result, tokensUsed);
      res.json({ success: true, result, provider });
    } catch (err) { res.status(500).json({ success: false, error: err.message }); }
  }
);

router.post('/to-content', checkAICredits,
  [body('workspace_id').notEmpty(), body('trend').notEmpty()],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });
    const { workspace_id, trend, niche = 'general', provider = 'claude', compare = false } = req.body;
    const prompt = `Transform this trend into content for a "${niche}" creator.\nTREND: "${trend}"\nCreate: 🎬 REEL CONCEPT (hook, structure, CTA, audio, caption+hashtags) | 📱 INSTAGRAM POST (full caption+20 hashtags) | 🎥 YOUTUBE SHORT (title+outline) | 💡 3 UNIQUE ANGLES to stand out | ⏰ URGENCY METER (days before trend peaks)`;
    try {
      const sys = 'You are a viral content strategist who turns trends into niche-specific content.';
      let result, tokensUsed;
      if (compare) {
        const data = await callAllAIs({ systemPrompt: sys, userMessage: prompt, userId: req.user.id, action: 'trend_to_content' });
        result = formatCompare(data.results); tokensUsed = data.tokensUsed;
        await saveGen(workspace_id, req.user.id, 'trend_content', null, trend, result, tokensUsed);
        return res.json({ success: true, result, compare: true, results: data.results });
      }
      const data = await callAI({ provider, systemPrompt: sys, userMessage: prompt, userId: req.user.id, action: 'trend_to_content' });
      result = data.result; tokensUsed = data.tokensUsed;
      await saveGen(workspace_id, req.user.id, 'trend_content', null, trend, result, tokensUsed);
      res.json({ success: true, result, provider });
    } catch (err) { res.status(500).json({ success: false, error: err.message }); }
  }
);

async function saveGen(wsId, userId, type, platform, topic, result, tokens) {
  await query(`INSERT INTO content_generations (workspace_id,user_id,type,platform,topic,result,tokens_used) VALUES ($1,$2,$3,$4,$5,$6,$7)`,
    [wsId, userId, type, platform, topic, result, tokens]);
}
function formatCompare(r) {
  return `${'═'.repeat(60)}\n🤖 CLAUDE\n${'═'.repeat(60)}\n${r.claude}\n\n${'═'.repeat(60)}\n💬 CHATGPT\n${'═'.repeat(60)}\n${r.chatgpt}\n\n${'═'.repeat(60)}\n✨ GEMINI\n${'═'.repeat(60)}\n${r.gemini}`;
}

module.exports = router;
