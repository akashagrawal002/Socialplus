const express = require('express');
const { body, validationResult } = require('express-validator');
const { authenticate, checkAICredits } = require('../middleware/auth');
const { query } = require('../config/database');
const { callClaude, PROMPTS } = require('../services/aiService');

const router = express.Router();
router.use(authenticate);

// ---- POST engagement ideas ----
router.post('/ideas', checkAICredits,
  [body('workspace_id').notEmpty(), body('eng_type').notEmpty()],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

    const { workspace_id, biz_type = '', goal = 'Increase Comments', eng_type } = req.body;

    try {
      const { result, tokensUsed } = await callClaude({
        systemPrompt: 'You are a social media engagement strategist and community manager expert.',
        userMessage: PROMPTS.engagement({ bizType: biz_type, goal, engType: eng_type }),
        userId: req.user.id,
        action: 'engagement_ideas'
      });

      await query(
        `INSERT INTO content_generations (workspace_id, user_id, type, topic, result, tokens_used)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [workspace_id, req.user.id, `engagement_${eng_type}`, biz_type, result, tokensUsed]
      );

      res.json({ success: true, result });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  }
);

// ---- POST comment reply generator ----
router.post('/reply', checkAICredits,
  [body('workspace_id').notEmpty(), body('comment').notEmpty()],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

    const {
      workspace_id, comment,
      comment_type = 'Positive / Compliment',
      tone = 'Professional & Warm'
    } = req.body;

    try {
      const { result, tokensUsed } = await callClaude({
        systemPrompt: 'You are a social media community manager expert who writes authentic, engaging, on-brand replies.',
        userMessage: PROMPTS.reply({ comment, commentType: comment_type, tone }),
        userId: req.user.id,
        action: 'comment_reply'
      });

      await query(
        `INSERT INTO content_generations (workspace_id, user_id, type, topic, result, tokens_used)
         VALUES ($1, $2, 'comment_reply', $3, $4, $5)`,
        [workspace_id, req.user.id, comment.slice(0, 100), result, tokensUsed]
      );

      res.json({ success: true, result });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  }
);

module.exports = router;
