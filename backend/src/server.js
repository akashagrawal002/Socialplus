require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const { connectDB } = require('./config/database');
const { connectRedis } = require('./config/redis');
const logger = require('./config/logger');

const authRoutes = require('./routes/auth');
const competitorRoutes = require('./routes/competitors');
const contentRoutes = require('./routes/content');
const trendsRoutes = require('./routes/trends');
const newsRoutes = require('./routes/news');
const engagementRoutes = require('./routes/engagement');
const dashboardRoutes = require('./routes/dashboard');
const { historyRouter, workspaceRouter } = require('./routes/history');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(compression());

if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('combined', { stream: { write: (msg) => logger.info(msg.trim()) } }));
}

const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: parseInt(process.env.API_RATE_LIMIT) || 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Too many requests, please try again later.' }
});
app.use('/api/', globalLimiter);

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'SocialPulse API', version: '1.0.0', timestamp: new Date().toISOString() });
});

app.use('/api/auth', authRoutes);
app.use('/api/workspaces', workspaceRouter);
app.use('/api/competitors', competitorRoutes);
app.use('/api/content', contentRoutes);
app.use('/api/trends', trendsRoutes);
app.use('/api/news', newsRoutes);
app.use('/api/engagement', engagementRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/history', historyRouter);

app.use('*', (req, res) => {
  res.status(404).json({ success: false, error: `Route ${req.originalUrl} not found` });
});

app.use((err, req, res, next) => {
  logger.error('Unhandled error:', { message: err.message });
  res.status(err.statusCode || 500).json({
    success: false,
    error: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message
  });
});

async function startServer() {
  try {
    await connectDB();
    await connectRedis();
    app.listen(PORT, () => {
      logger.info(`SocialPulse API running on port ${PORT}`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
module.exports = app;
