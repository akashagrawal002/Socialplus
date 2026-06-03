const express = require('express');
const { authenticate } = require('../middleware/auth');
const { query } = require('../config/database');
const { getUserUsageStats } = require('../services/aiService');

const router = express.Router();
router.use(authenticate);

// ---- GET dashboard stats ----
router.get('/stats', async (req, res) => {
  const { workspace_id } = req.query;

  try {
    const [usageStats, workspaceStats, recentGenerations] = await Promise.all([
      getUserUsageStats(req.user.id),
      workspace_id ? query(
        `SELECT 
           COUNT(*) FILTER (WHERE type LIKE 'competitor%') as competitors_analyzed,
           COUNT(*) FILTER (WHERE type = 'reel_ideas') as reel_sets,
           COUNT(*) FILTER (WHERE type = 'trends') as trend_reports,
           COUNT(*) FILTER (WHERE is_saved = true) as saved_count
         FROM content_generations WHERE workspace_id = $1`,
        [workspace_id]
      ) : { rows: [{}] },
      workspace_id ? query(
        `SELECT id, type, topic, created_at FROM content_generations
         WHERE workspace_id = $1 ORDER BY created_at DESC LIMIT 5`,
        [workspace_id]
      ) : { rows: [] }
    ]);

    res.json({
      success: true,
      stats: {
        usage: usageStats,
        workspace: workspaceStats.rows[0] || {},
        ai_credits: req.user.ai_credits,
        plan: req.user.plan
      },
      recent: recentGenerations.rows
    });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to fetch stats.' });
  }
});

module.exports = router;
