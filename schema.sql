-- =============================================
--  GitHub Profile Analyzer — Database Schema
-- =============================================

-- Create the database if it doesn't exist
CREATE DATABASE IF NOT EXISTS github_analyzer;

-- Switch to it
USE github_analyzer;

-- Main table that holds every analyzed GitHub profile
CREATE TABLE IF NOT EXISTS github_profiles (
  id                        INT AUTO_INCREMENT PRIMARY KEY,

  -- Basic profile info (straight from GitHub API)
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

  -- Derived / enriched insights
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

  -- Timestamps
  analyzed_at               DATETIME      DEFAULT CURRENT_TIMESTAMP,
  updated_at                DATETIME      DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  -- Index for faster lookups
  INDEX idx_username (username),
  INDEX idx_analyzed_at (analyzed_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
