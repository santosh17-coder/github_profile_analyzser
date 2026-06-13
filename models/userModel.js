const { pool } = require('../config/db');

/**
 * Save a freshly analyzed profile to the database.
 * Uses INSERT ... ON DUPLICATE KEY UPDATE so re-analyzing the
 * same username overwrites the old row instead of crashing.
 *
 * @param {Object} insights - The combined insights object from githubService.
 * @returns {Object} The inserted / updated row.
 */
async function saveProfile(insights) {
  const query = `
    INSERT INTO github_profiles (
      username, name, bio, avatar_url, html_url, location, company,
      blog, email, public_repos, public_gists, followers, following,
      account_created_at, account_age_years, total_stars, total_forks,
      most_starred_repo_name, most_starred_repo_stars, top_languages,
      avg_stars_per_repo, follower_following_ratio, profile_completeness,
      recently_active, analyzed_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
    ON DUPLICATE KEY UPDATE
      name                     = VALUES(name),
      bio                      = VALUES(bio),
      avatar_url               = VALUES(avatar_url),
      html_url                 = VALUES(html_url),
      location                 = VALUES(location),
      company                  = VALUES(company),
      blog                     = VALUES(blog),
      email                    = VALUES(email),
      public_repos             = VALUES(public_repos),
      public_gists             = VALUES(public_gists),
      followers                = VALUES(followers),
      following                = VALUES(following),
      account_created_at       = VALUES(account_created_at),
      account_age_years        = VALUES(account_age_years),
      total_stars              = VALUES(total_stars),
      total_forks              = VALUES(total_forks),
      most_starred_repo_name   = VALUES(most_starred_repo_name),
      most_starred_repo_stars  = VALUES(most_starred_repo_stars),
      top_languages            = VALUES(top_languages),
      avg_stars_per_repo       = VALUES(avg_stars_per_repo),
      follower_following_ratio = VALUES(follower_following_ratio),
      profile_completeness     = VALUES(profile_completeness),
      recently_active          = VALUES(recently_active),
      analyzed_at              = NOW()
  `;

  const values = [
    insights.username,
    insights.name,
    insights.bio,
    insights.avatar_url,
    insights.html_url,
    insights.location,
    insights.company,
    insights.blog,
    insights.email,
    insights.public_repos,
    insights.public_gists,
    insights.followers,
    insights.following,
    insights.account_created_at
      ? new Date(insights.account_created_at).toISOString().slice(0, 19).replace('T', ' ')
      : null,
    insights.account_age_years,
    insights.total_stars,
    insights.total_forks,
    insights.most_starred_repo_name,
    insights.most_starred_repo_stars,
    JSON.stringify(insights.top_languages),
    insights.avg_stars_per_repo,
    insights.follower_following_ratio,
    insights.profile_completeness,
    insights.recently_active,
  ];

  await pool.execute(query, values);

  // Return the freshly saved row so the caller can send it back to the client
  return getProfileByUsername(insights.username);
}

/**
 * Fetch every stored profile, newest first.
 * Supports pagination (page & limit) and an optional keyword search
 * that matches against username, name, location, or company.
 *
 * @param {Object} options
 * @param {number} options.page   - Current page (1-indexed).
 * @param {number} options.limit  - Rows per page.
 * @param {string} options.search - Optional keyword filter.
 * @returns {{ profiles: Array, total: number, page: number, limit: number, totalPages: number }}
 */
async function getAllProfiles({ page = 1, limit = 10, search = '' }) {
  let whereClause = '';
  const params = [];

  // If the caller provided a search term, filter on several text columns
  if (search.trim()) {
    whereClause = `WHERE username LIKE ? OR name LIKE ? OR location LIKE ? OR company LIKE ?`;
    const wildcard = `%${search.trim()}%`;
    params.push(wildcard, wildcard, wildcard, wildcard);
  }

  // First, get the total count so we can compute pagination metadata
  const countQuery = `SELECT COUNT(*) AS total FROM github_profiles ${whereClause}`;
  const [[{ total }]] = await pool.execute(countQuery, params);

  // Then fetch the actual page of results
  const offset = (page - 1) * limit;
  const dataQuery = `
    SELECT * FROM github_profiles
    ${whereClause}
    ORDER BY analyzed_at DESC
    LIMIT ${parseInt(limit, 10)} OFFSET ${parseInt(offset, 10)}
  `;
  const [rows] = await pool.execute(dataQuery, params);

  return {
    profiles: rows,
    total,
    page: parseInt(page, 10),
    limit: parseInt(limit, 10),
    totalPages: Math.ceil(total / limit),
  };
}

/**
 * Retrieve a single stored profile by GitHub username.
 *
 * @param {string} username
 * @returns {Object|null} The profile row, or null if not found.
 */
async function getProfileByUsername(username) {
  const [rows] = await pool.execute(
    'SELECT * FROM github_profiles WHERE username = ?',
    [username]
  );
  return rows.length > 0 ? rows[0] : null;
}

/**
 * Delete a stored profile by username.
 *
 * @param {string} username
 * @returns {boolean} true if a row was actually deleted.
 */
async function deleteProfile(username) {
  const [result] = await pool.execute(
    'DELETE FROM github_profiles WHERE username = ?',
    [username]
  );
  return result.affectedRows > 0;
}

module.exports = {
  saveProfile,
  getAllProfiles,
  getProfileByUsername,
  deleteProfile,
};
