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
    const { workspace_id, platform = '', topic = '', news_type = 'latest news', provider = 'claude', compare = false } = req.body;
    const cacheKey = `news:${platform}:${topic}:${news_type}:${provider}`.toLowerCase().replace(/\s/g,'_');
    if (!compare) {
      const cached = await getCache(cacheKey);
      if (cached) return res.json({ success: true, result: cached.result, cached: true });
    }
    try {
      const sys = 'You are a social media industry journalist with access to the latest news.';
      const msg = PROMPTS.news({ platform, topic, newsType: news_type });
      let result, tokensUsed;
      if (compare) {
        const data = await callAllAIs({ systemPrompt: sys, userMessage: msg, userId: req.user.id, action: 'news' });
        result = formatCompare(data.results); tokensUsed = data.tokensUsed;
        await saveGen(workspace_id, req.user.id, 'news', platform || 'All', topic || 'General', result, tokensUsed);
        return res.json({ success: true, result, compare: true, results: data.results });
      }
      const useWebSearch = provider === 'claude';
      const data = await callAI({ provider, systemPrompt: sys, userMessage: msg, userId: req.user.id, action: 'news', useWebSearch });
      result = data.result; tokensUsed = data.tokensUsed;
      await query(`INSERT INTO news_cache (cache_key,platform,topic,news_type,data,expires_at) VALUES ($1,$2,$3,$4,$5,NOW()+INTERVAL '3 hours') ON CONFLICT(cache_key) DO UPDATE SET data=$5,expires_at=NOW()+INTERVAL '3 hours'`,
        [cacheKey, platform, topic, news_type, result]).catch(()=>{});
      await setCache(cacheKey, { result }, 10800);
      await saveGen(workspace_id, req.user.id, 'news', platform || 'All', topic || 'General', result, tokensUsed);
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
