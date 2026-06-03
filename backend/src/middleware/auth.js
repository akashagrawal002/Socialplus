const jwt = require('jsonwebtoken');
const { query } = require('../config/database');

async function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, error: 'Access denied. No token provided.' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Fetch fresh user from DB (catches deactivated accounts)
    const result = await query(
      'SELECT id, email, full_name, plan, ai_credits FROM users WHERE id = $1',
      [decoded.userId]
    );

    if (!result.rows.length) {
      return res.status(401).json({ success: false, error: 'User not found.' });
    }

    req.user = result.rows[0];
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, error: 'Token expired. Please log in again.' });
    }
    return res.status(401).json({ success: false, error: 'Invalid token.' });
  }
}

/**
 * Check that user has sufficient AI credits
 */
async function checkAICredits(req, res, next) {
  if (req.user.ai_credits <= 0 && req.user.plan === 'free') {
    return res.status(429).json({
      success: false,
      error: 'You have used all your free AI credits. Upgrade to Pro for unlimited access.',
      upgrade: true
    });
  }
  next();
}

module.exports = { authenticate, checkAICredits };
