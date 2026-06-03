const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const { query } = require('../config/database');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// ---- Register ----
router.post('/register',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
    body('full_name').trim().isLength({ min: 2 })
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { email, password, full_name } = req.body;

    try {
      // Check if user exists
      const existing = await query('SELECT id FROM users WHERE email = $1', [email]);
      if (existing.rows.length) {
        return res.status(409).json({ success: false, error: 'Email already registered.' });
      }

      const password_hash = await bcrypt.hash(password, 12);

      const result = await query(
        `INSERT INTO users (email, password_hash, full_name, plan, ai_credits)
         VALUES ($1, $2, $3, 'free', 50)
         RETURNING id, email, full_name, plan, ai_credits, created_at`,
        [email, password_hash, full_name]
      );

      const user = result.rows[0];
      const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN || '7d'
      });

      // Create a default workspace
      await query(
        `INSERT INTO workspaces (user_id, name) VALUES ($1, $2)`,
        [user.id, `${full_name}'s Workspace`]
      );

      res.status(201).json({ success: true, token, user });
    } catch (err) {
      res.status(500).json({ success: false, error: 'Registration failed.' });
    }
  }
);

// ---- Login ----
router.post('/login',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').notEmpty()
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { email, password } = req.body;

    try {
      const result = await query(
        'SELECT id, email, full_name, password_hash, plan, ai_credits FROM users WHERE email = $1',
        [email]
      );

      if (!result.rows.length) {
        return res.status(401).json({ success: false, error: 'Invalid email or password.' });
      }

      const user = result.rows[0];
      const valid = await bcrypt.compare(password, user.password_hash);
      if (!valid) {
        return res.status(401).json({ success: false, error: 'Invalid email or password.' });
      }

      // Update last login
      await query('UPDATE users SET last_login_at = NOW() WHERE id = $1', [user.id]);

      const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN || '7d'
      });

      delete user.password_hash;
      res.json({ success: true, token, user });
    } catch (err) {
      res.status(500).json({ success: false, error: 'Login failed.' });
    }
  }
);

// ---- Get current user ----
router.get('/me', authenticate, (req, res) => {
  res.json({ success: true, user: req.user });
});

// ---- Change Password ----
router.put('/password', authenticate,
  [
    body('current_password').notEmpty(),
    body('new_password').isLength({ min: 8 })
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { current_password, new_password } = req.body;

    try {
      const result = await query('SELECT password_hash FROM users WHERE id = $1', [req.user.id]);
      const valid = await bcrypt.compare(current_password, result.rows[0].password_hash);
      if (!valid) {
        return res.status(400).json({ success: false, error: 'Current password is incorrect.' });
      }

      const new_hash = await bcrypt.hash(new_password, 12);
      await query('UPDATE users SET password_hash = $1 WHERE id = $2', [new_hash, req.user.id]);

      res.json({ success: true, message: 'Password updated successfully.' });
    } catch (err) {
      res.status(500).json({ success: false, error: 'Password update failed.' });
    }
  }
);

module.exports = router;
