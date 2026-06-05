const pool = require('../db');

async function initAdminDatabase() {
  try {
    console.log('Initializing Admin Database Tables...');

    // Admin users table - maps users to admin roles
    await pool.query(`
      CREATE TABLE IF NOT EXISTS admin_users (
        id SERIAL PRIMARY KEY,
        user_id INT UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        role VARCHAR(50) DEFAULT 'moderator',
        permissions JSONB DEFAULT '{"therapist_verify": true, "content_moderate": true, "user_manage": true}',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✔ admin_users table created');

    // Deleted content log - track all deleted posts/comments
    await pool.query(`
      CREATE TABLE IF NOT EXISTS deleted_content (
        id SERIAL PRIMARY KEY,
        content_type VARCHAR(50) NOT NULL,
        content_id INT NOT NULL,
        reason TEXT,
        deleted_by INT REFERENCES users(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✔ deleted_content table created');

    // Admin activity log - track all admin actions
    await pool.query(`
      CREATE TABLE IF NOT EXISTS admin_activity (
        id SERIAL PRIMARY KEY,
        admin_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        action VARCHAR(100) NOT NULL,
        target_type VARCHAR(50),
        target_id INT,
        details JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✔ admin_activity table created');

    // Add columns to existing tables (if not exists)

    // Posts table: add flagging/moderation columns
    try {
      await pool.query('ALTER TABLE posts ADD COLUMN flagged BOOLEAN DEFAULT false');
      console.log('✔ Added flagged column to posts table');
    } catch (err) {
      if (!err.message.includes('already exists')) throw err;
    }

    try {
      await pool.query('ALTER TABLE posts ADD COLUMN moderated_by INT REFERENCES users(id)');
      console.log('✔ Added moderated_by column to posts table');
    } catch (err) {
      if (!err.message.includes('already exists')) throw err;
    }

    try {
      await pool.query('ALTER TABLE posts ADD COLUMN moderated_at TIMESTAMP');
      console.log('✔ Added moderated_at column to posts table');
    } catch (err) {
      if (!err.message.includes('already exists')) throw err;
    }

    // Comments table: add flagging/moderation columns
    try {
      await pool.query('ALTER TABLE comments ADD COLUMN flagged BOOLEAN DEFAULT false');
      console.log('✔ Added flagged column to comments table');
    } catch (err) {
      if (!err.message.includes('already exists')) throw err;
    }

    try {
      await pool.query('ALTER TABLE comments ADD COLUMN moderated_by INT REFERENCES users(id)');
      console.log('✔ Added moderated_by column to comments table');
    } catch (err) {
      if (!err.message.includes('already exists')) throw err;
    }

    try {
      await pool.query('ALTER TABLE comments ADD COLUMN moderated_at TIMESTAMP');
      console.log('✔ Added moderated_at column to comments table');
    } catch (err) {
      if (!err.message.includes('already exists')) throw err;
    }

    // Specialists table: add verification columns
    try {
      await pool.query('ALTER TABLE specialists ADD COLUMN verified BOOLEAN DEFAULT false');
      console.log('✔ Added verified column to specialists table');
    } catch (err) {
      if (!err.message.includes('already exists')) throw err;
    }

    try {
      await pool.query('ALTER TABLE specialists ADD COLUMN verified_by INT REFERENCES users(id)');
      console.log('✔ Added verified_by column to specialists table');
    } catch (err) {
      if (!err.message.includes('already exists')) throw err;
    }

    try {
      await pool.query('ALTER TABLE specialists ADD COLUMN verified_at TIMESTAMP');
      console.log('✔ Added verified_at column to specialists table');
    } catch (err) {
      if (!err.message.includes('already exists')) throw err;
    }

    try {
      await pool.query('ALTER TABLE specialists ADD COLUMN rejection_reason TEXT');
      console.log('✔ Added rejection_reason column to specialists table');
    } catch (err) {
      if (!err.message.includes('already exists')) throw err;
    }

    try {
      await pool.query('ALTER TABLE specialists ADD COLUMN rejected_by INT REFERENCES users(id)');
      console.log('✔ Added rejected_by column to specialists table');
    } catch (err) {
      if (!err.message.includes('already exists')) throw err;
    }

    try {
      await pool.query('ALTER TABLE specialists ADD COLUMN rejected_at TIMESTAMP');
      console.log('✔ Added rejected_at column to specialists table');
    } catch (err) {
      if (!err.message.includes('already exists')) throw err;
    }

    // Users table: add ban columns
    try {
      await pool.query('ALTER TABLE users ADD COLUMN banned BOOLEAN DEFAULT false');
      console.log('✔ Added banned column to users table');
    } catch (err) {
      if (!err.message.includes('already exists')) throw err;
    }

    try {
      await pool.query('ALTER TABLE users ADD COLUMN ban_reason TEXT');
      console.log('✔ Added ban_reason column to users table');
    } catch (err) {
      if (!err.message.includes('already exists')) throw err;
    }

    try {
      await pool.query('ALTER TABLE users ADD COLUMN banned_by INT REFERENCES users(id)');
      console.log('✔ Added banned_by column to users table');
    } catch (err) {
      if (!err.message.includes('already exists')) throw err;
    }

    try {
      await pool.query('ALTER TABLE users ADD COLUMN banned_at TIMESTAMP');
      console.log('✔ Added banned_at column to users table');
    } catch (err) {
      if (!err.message.includes('already exists')) throw err;
    }

    console.log('\n✔ Admin Database initialized successfully!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Database initialization error:', err.message);
    process.exit(1);
  }
}

initAdminDatabase();
