const { Pool } = require('pg');
const logger = require('./logger');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production'
    ? { rejectUnauthorized: false }
    : false,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

pool.on('error', (err) => {
  logger.error('Unexpected PostgreSQL pool error:', err);
});

async function connectDB() {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT NOW()');
    client.release();
    logger.info(`✅ PostgreSQL connected — Server time: ${result.rows[0].now}`);
  } catch (error) {
    logger.error('❌ PostgreSQL connection failed:', error.message);
    throw error;
  }
}

/**
 * Execute a query with optional parameters
 * @param {string} text - SQL query
 * @param {Array} params - Query parameters
 */
async function query(text, params) {
  const start = Date.now();
  try {
    const result = await pool.query(text, params);
    const duration = Date.now() - start;
    if (process.env.NODE_ENV === 'development') {
      logger.debug(`Query executed in ${duration}ms: ${text.slice(0, 80)}`);
    }
    return result;
  } catch (error) {
    logger.error('Database query error:', { text, error: error.message });
    throw error;
  }
}

/**
 * Get a client from the pool (for transactions)
 */
async function getClient() {
  return pool.connect();
}

module.exports = { connectDB, query, getClient, pool };
