/**
 * Initializes the database: runs schema.sql then seed.sql
 *
 * Usage:  node scripts/initDb.js
 */
const fs = require('fs');
const path = require('path');
const pool = require('../db');

async function run() {
  const client = await pool.connect();
  try {
    console.log('→ Applying schema...');
    const schema = fs.readFileSync(path.join(__dirname, '..', 'schema.sql'), 'utf8');
    await client.query(schema);

    console.log('→ Seeding data...');
    const seed = fs.readFileSync(path.join(__dirname, '..', 'seed.sql'), 'utf8');
    await client.query(seed);

    console.log('✔ Database ready.');
  } catch (err) {
    console.error('✖ DB init failed:', err.message);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

run();
