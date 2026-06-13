const mysql = require('mysql2/promise');

// Create Connection Pool
const pool = mysql.createPool({
  host: process.env.MYSQLHOST,
  port: Number(process.env.MYSQLPORT),
  user: process.env.MYSQLUSER,
  password: process.env.MYSQLPASSWORD,
  database: process.env.MYSQLDATABASE,

  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,

  ssl: {
    rejectUnauthorized: false
  }
});

// Test Database Connection
async function testConnection() {
  try {
    console.log('=== DATABASE CONFIG ===');
    console.log('HOST:', process.env.MYSQLHOST);
    console.log('PORT:', process.env.MYSQLPORT);
    console.log('DATABASE:', process.env.MYSQLDATABASE);
    console.log('USER:', process.env.MYSQLUSER);
    console.log('=======================');

    const connection = await pool.getConnection();

    console.log('✅ MySQL Connected Successfully');

    connection.release();
  } catch (error) {
    console.error('❌ MySQL Connection Failed');
    console.error(error);
    throw error;
  }
}

// Create Table Automatically
async function initializeDatabase() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS github_profiles (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(100) NOT NULL UNIQUE,
        name VARCHAR(255),
        bio TEXT,
        avatar_url VARCHAR(500),
        html_url VARCHAR(500),
        location VARCHAR(255),
        company VARCHAR(255),
        blog VARCHAR(500),
        email VARCHAR(255),

        public_repos INT DEFAULT 0,
        public_gists INT DEFAULT 0,
        followers INT DEFAULT 0,
        following INT DEFAULT 0,

        account_created_at DATETIME,
        account_age_years DECIMAL(5,2) DEFAULT 0,

        total_stars INT DEFAULT 0,
        total_forks INT DEFAULT 0,

        most_starred_repo_name VARCHAR(255),
        most_starred_repo_stars INT DEFAULT 0,

        top_languages JSON,

        avg_stars_per_repo DECIMAL(10,2) DEFAULT 0,
        follower_following_ratio DECIMAL(10,2) DEFAULT 0,

        profile_completeness INT DEFAULT 0,
        recently_active BOOLEAN DEFAULT FALSE,

        analyzed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    console.log('✅ github_profiles table ready');
  } catch (error) {
    console.error('❌ Failed to create table');
    console.error(error);
    throw error;
  }
}

module.exports = {
  pool,
  testConnection,
  initializeDatabase
};
