// ============================================
//  Database Configuration — MySQL Connection Pool
// ============================================

const mysql = require('mysql2/promise');
require('dotenv').config();

// Build the pool from environment variables
// Supports both Railway's auto-injected vars (MYSQLHOST etc.)
// and our custom vars (DB_HOST etc.) as fallbacks
const poolConfig = {
  host: process.env.MYSQLHOST || process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.MYSQLPORT || process.env.DB_PORT, 10) || 3306,
  user: process.env.MYSQLUSER || process.env.DB_USER || 'root',
  password: process.env.MYSQLPASSWORD || process.env.DB_PASSWORD || '',
  database: process.env.MYSQLDATABASE || process.env.DB_NAME || 'github_analyzer',

  // Pool-specific settings
  waitForConnections: true,   // queue requests when all connections are busy
  connectionLimit: 10,        // max simultaneous connections
  queueLimit: 0,              // unlimited queue (0 = no cap)
};

// Cloud MySQL providers require SSL connections
if (process.env.NODE_ENV === 'production') {
  poolConfig.ssl = { rejectUnauthorized: false };
}

// Use Railway's connection URL if provided, otherwise use individual variables
const connectionString = process.env.MYSQL_URL || process.env.DATABASE_URL;

const pool = connectionString 
  ? mysql.createPool(connectionString) 
  : mysql.createPool(poolConfig);

/**
 * Quick connectivity check — called once at server startup so we
 * know immediately if the database is unreachable.
 */
async function testConnection() {
  try {
    const connection = await pool.getConnection();
    console.log('MySQL connected successfully');
    connection.release();
  } catch (error) {
    console.error('MySQL connection failed:', error);
    process.exit(1);
  }
}

/**
 * Auto-create the github_profiles table if it doesn't already exist.
 * Uses pool.query() (NOT pool.execute()) because DDL statements
 * cannot be run as prepared statements in mysql2.
 */
async function initializeDatabase() {
  // Simple CREATE TABLE without inline INDEX — maximum compatibility
  const createTableSQL = `CREATE TABLE IF NOT EXISTS github_profiles (
    id                        INT AUTO_INCREMENT PRIMARY KEY,
    username                  VARCHAR(100)  NOT NULL UNIQUE,
    name                      VARCHAR(255)  DEFAULT NULL,
    bio                       TEXT          DEFAULT NULL,
    avatar_url                VARCHAR(500)  DEFAULT NULL,
    html_url                  VARCHAR(500)  DEFAULT NULL,
    location                  VARCHAR(255)  DEFAULT NULL,
    company                   VARCHAR(255)  DEFAULT NULL,
    blog                      VARCHAR(500)  DEFAULT NULL,
    email                     VARCHAR(255)  DEFAULT NULL,
    public_repos              INT           DEFAULT 0,
    public_gists              INT           DEFAULT 0,
    followers                 INT           DEFAULT 0,
    following                 INT           DEFAULT 0,
    account_created_at        DATETIME      DEFAULT NULL,
    account_age_years         DECIMAL(5,2)  DEFAULT 0,
    total_stars               INT           DEFAULT 0,
    total_forks               INT           DEFAULT 0,
    most_starred_repo_name    VARCHAR(255)  DEFAULT NULL,
    most_starred_repo_stars   INT           DEFAULT 0,
    top_languages             JSON          DEFAULT NULL,
    avg_stars_per_repo        DECIMAL(10,2) DEFAULT 0,
    follower_following_ratio  DECIMAL(10,2) DEFAULT 0,
    profile_completeness      INT           DEFAULT 0,
    recently_active           BOOLEAN       DEFAULT FALSE,
    analyzed_at               DATETIME      DEFAULT CURRENT_TIMESTAMP,
    updated_at                DATETIME      DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  )`;

  try {
    await pool.query(createTableSQL);
    console.log('Database table ready');
  } catch (error) {
    console.error('Failed to create table:', error.message);
    console.error('Full error:', error);
    process.exit(1);
  }
}

module.exports = { pool, testConnection, initializeDatabase };
