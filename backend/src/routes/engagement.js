const express = require('express');
const { body, validationResult } = require('express-validator');
const { authenticate, checkAICredits } = require('../middleware/auth');
const { query } = require('../config/database');
const { callAI, callAllAIs, PROMPTS } = require('../services/aiService');

const router = express.Router();
router.use(authenticate);

router.post('/ideas', checkAICredits,
  [body('workspace_id').notEmpty(), body('eng_type').notEmpty()],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });
    const { workspace_id, biz_type = '', goal = 'Increase Comments', eng_type, provider = 'claude', compare = false } = req.body;
    try {
      const sys = 'You are a social media engagement strategist and community manager expert.';
      const msg = PROMPTS.engagement({ bizType: biz_type, goal, engType: eng_type });
      let result, tokensUsed;
      if (compare) {
        const data = await callAllAIs({ systemPrompt: sys, userMessage: msg, userId: req.user.id, action: 'engagement_ideas' });
        result = formatCompare(data.results); tokensUsed = data.tokensUsed;
        await saveGen(workspace_id, req.user.id, `engagement_${eng_type}`, biz_type, result, tokensUsed);
        return res.json({ success: true, result, compare: true, results: data.results });
      }
      const data = await callAI({ provider, systemPrompt: sys, userMessage: msg, userId: req.user.id, action: 'engagement_ideas' });
      result = data.result; tokensUsed = data.tokensUsed;
      await saveGen(workspace_id, req.user.id, `engagement_${eng_type}`, biz_type, result, tokensUsed);
      res.json({ success: true, result, provider });
    } catch (err) { res.status(500).json({ success: false, error: err.message }); }
  }
);

router.post('/reply', checkAICredits,
  [body('workspace_id').notEmpty(), body('comment').notEmpty()],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });
    const { workspace_id, comment, comment_type = 'Positive / Compliment', tone = 'Professional & Warm', provider = 'claude', compare = false } = req.body;
    try {
      const sys = 'You are a social media community manager expert who writes authentic, engaging replies.';
      const msg = PROMPTS.reply({ comment, commentType: comment_type, tone });
      let result, tokensUsed;
      if (compare) {
        const data = await callAllAIs({ systemPrompt: sys, userMessage: msg, userId: req.user.id, action: 'comment_reply' });
        result = formatCompare(data.results); tokensUsed = data.tokensUsed;
        await saveGen(workspace_id, req.user.id, 'comment_reply', comment.slice(0,100), result, tokensUsed);
        return res.json({ success: true, result, compare: true, results: data.results });
      }
      const data = await callAI({ provider, systemPrompt: sys, userMessage: msg, userId: req.user.id, action: 'comment_reply' });
      result = data.result; tokensUsed = data.tokensUsed;
      await saveGen(workspace_id, req.user.id, 'comment_reply', comment.slice(0,100), result, tokensUsed);
      res.json({ success: true, result, provider });
    } catch (err) { res.status(500).json({ success: false, error: err.message }); }
  }
);

async function saveGen(wsId, userId, type, topic, result, tokens) {
  await query(`INSERT INTO content_generations (workspace_id,user_id,type,topic,result,tokens_used) VALUES ($1,$2,$3,$4,$5,$6)`,
    [wsId, userId, type, topic, result, tokens]);
}
function formatCompare(r) {
  return `${'═'.repeat(60)}\n🤖 CLAUDE\n${'═'.repeat(60)}\n${r.claude}\n\n${'═'.repeat(60)}\n💬 CHATGPT\n${'═'.repeat(60)}\n${r.chatgpt}\n\n${'═'.repeat(60)}\n✨ GEMINI\n${'═'.repeat(60)}\n${r.gemini}`;
}

module.exports = router;
