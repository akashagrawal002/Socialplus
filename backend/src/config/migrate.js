// Run: npm run db:migrate
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function migrate() {
  const migrationsDir = path.join(__dirname, '../../../database/migrations');
  const files = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql')).sort();

  console.log(`📦 Running ${files.length} migration(s)...\n`);

  for (const file of files) {
    const filePath = path.join(migrationsDir, file);
    const sql = fs.readFileSync(filePath, 'utf8');
    try {
      await pool.query(sql);
      console.log(`  ✅ ${file}`);
    } catch (error) {
      console.error(`  ❌ ${file} failed:`, error.message);
      process.exit(1);
    }
  }

  console.log('\n✨ All migrations completed successfully!');
  await pool.end();
}

migrate().catch(err => {
  console.error('Migration error:', err);
  process.exit(1);
});
