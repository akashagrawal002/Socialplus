const express = require('express');
const { authenticate } = require('../middleware/auth');
const { query } = require('../config/database');

const historyRouter = express.Router();
const workspaceRouter = express.Router();

historyRouter.use(authenticate);
workspaceRouter.use(authenticate);

// ---- GET generation history ----
historyRouter.get('/', async (req, res) => {
  const { workspace_id, type, limit = 20, offset = 0 } = req.query;
  if (!workspace_id) return res.status(400).json({ success: false, error: 'workspace_id required' });

  try {
    const conditions = ['workspace_id = $1'];
    const params = [workspace_id];
    let idx = 2;

    if (type) { conditions.push(`type = $${idx}`); params.push(type); idx++; }

    params.push(parseInt(limit), parseInt(offset));

    const result = await query(
      `SELECT id, type, platform, topic, result, tokens_used, is_saved, is_favorited, created_at
       FROM content_generations
       WHERE ${conditions.join(' AND ')}
       ORDER BY created_at DESC
       LIMIT $${idx} OFFSET $${idx + 1}`,
      params
    );

    const total = await query(
      `SELECT COUNT(*) FROM content_generations WHERE workspace_id = $1${type ? ` AND type = '${type}'` : ''}`,
      [workspace_id]
    );

    res.json({ success: true, history: result.rows, total: parseInt(total.rows[0].count) });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to fetch history.' });
  }
});

// ---- PATCH toggle favorite ----
historyRouter.patch('/:id/favorite', async (req, res) => {
  try {
    const result = await query(
      `UPDATE content_generations SET is_favorited = NOT is_favorited
       WHERE id = $1 AND user_id = $2 RETURNING is_favorited`,
      [req.params.id, req.user.id]
    );
    res.json({ success: true, is_favorited: result.rows[0]?.is_favorited });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Update failed.' });
  }
});

// ---- DELETE history item ----
historyRouter.delete('/:id', async (req, res) => {
  try {
    await query(
      `DELETE FROM content_generations WHERE id = $1 AND user_id = $2`,
      [req.params.id, req.user.id]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Delete failed.' });
  }
});

// ============================================================
// WORKSPACES
// ============================================================

// ---- GET all workspaces ----
workspaceRouter.get('/', async (req, res) => {
  try {
    const result = await query(
      `SELECT * FROM workspaces WHERE user_id = $1 ORDER BY created_at ASC`,
      [req.user.id]
    );
    res.json({ success: true, workspaces: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to fetch workspaces.' });
  }
});

// ---- POST create workspace ----
workspaceRouter.post('/', async (req, res) => {
  const { name, business_name, industry, niche, target_audience, primary_platform, location, brand_voice } = req.body;
  if (!name) return res.status(400).json({ success: false, error: 'Workspace name required.' });

  try {
    const result = await query(
      `INSERT INTO workspaces (user_id, name, business_name, industry, niche, target_audience, primary_platform, location, brand_voice)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
      [req.user.id, name, business_name, industry, niche, target_audience, primary_platform, location, brand_voice]
    );
    res.status(201).json({ success: true, workspace: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to create workspace.' });
  }
});

// ---- PUT update workspace ----
workspaceRouter.put('/:id', async (req, res) => {
  const { name, business_name, industry, niche, target_audience, primary_platform, location, brand_voice } = req.body;
  try {
    const result = await query(
      `UPDATE workspaces SET
         name=$1, business_name=$2, industry=$3, niche=$4,
         target_audience=$5, primary_platform=$6, location=$7, brand_voice=$8
       WHERE id=$9 AND user_id=$10 RETURNING *`,
      [name, business_name, industry, niche, target_audience, primary_platform, location, brand_voice, req.params.id, req.user.id]
    );
    if (!result.rows.length) return res.status(404).json({ success: false, error: 'Workspace not found.' });
    res.json({ success: true, workspace: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Update failed.' });
  }
});

// ---- DELETE workspace ----
workspaceRouter.delete('/:id', async (req, res) => {
  try {
    await query(
      `DELETE FROM workspaces WHERE id = $1 AND user_id = $2`,
      [req.params.id, req.user.id]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Delete failed.' });
  }
});

module.exports = { historyRouter, workspaceRouter };
