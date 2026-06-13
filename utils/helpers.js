/**
 * Calculate the age of an account in years (to 2 decimal places).
 *
 * @param {string} createdAt - ISO 8601 date string from GitHub.
 * @returns {number} Age in years, e.g. 12.45
 */
function calculateAccountAge(createdAt) {
  const created = new Date(createdAt);
  const now = new Date();
  const diffMs = now - created;
  const years = diffMs / (1000 * 60 * 60 * 24 * 365.25);
  return parseFloat(years.toFixed(2));
}

/**
 * Profile completeness score (0 – 100).
 * Each field that is filled adds to the score.
 *
 * @param {Object} profile - The raw GitHub user profile object.
 * @returns {number} Completeness percentage.
 */
function calculateProfileCompleteness(profile) {
  // These are the fields a "complete" profile would have filled in
  const fields = ['name', 'bio', 'location', 'company', 'blog', 'email'];
  let filled = 0;

  fields.forEach((field) => {
    // GitHub returns null or empty string for unfilled fields
    if (profile[field] && profile[field].toString().trim() !== '') {
      filled++;
    }
  });

  return Math.round((filled / fields.length) * 100);
}

/**
 * Determine whether the user has been "recently active" —
 * i.e. has at least one repo updated in the last 90 days.
 *
 * @param {Array} repos - Array of repo objects from GitHub API.
 * @returns {boolean}
 */
function isRecentlyActive(repos) {
  const ninetyDaysAgo = new Date();
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

  return repos.some((repo) => {
    const pushed = new Date(repo.pushed_at);
    return pushed >= ninetyDaysAgo;
  });
}

/**
 * Aggregate language usage across all repos.
 * Returns an object like { "JavaScript": 12, "Python": 5, ... }
 * sorted by count descending — then trimmed to the top 5.
 *
 * @param {Array} repos - Array of repo objects.
 * @returns {Object} Top languages with their repo counts.
 */
function aggregateLanguages(repos) {
  const counts = {};

  repos.forEach((repo) => {
    if (repo.language) {
      counts[repo.language] = (counts[repo.language] || 0) + 1;
    }
  });

  // Sort by count descending and keep only the top 5
  const sorted = Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  const topLanguages = {};
  sorted.forEach(([lang, count]) => {
    topLanguages[lang] = count;
  });

  return topLanguages;
}

/**
 * Find the repository with the most stars.
 *
 * @param {Array} repos - Array of repo objects.
 * @returns {{ name: string, stars: number }}
 */
function findMostStarredRepo(repos) {
  if (repos.length === 0) {
    return { name: null, stars: 0 };
  }

  let best = repos[0];
  repos.forEach((repo) => {
    if (repo.stargazers_count > best.stargazers_count) {
      best = repo;
    }
  });

  return { name: best.name, stars: best.stargazers_count };
}

/**
 * Format a standard success response.
 */
function successResponse(res, data, message = 'Success', statusCode = 200) {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
}

/**
 * Format a standard error response.
 */
function errorResponse(res, message = 'Something went wrong', statusCode = 500, errors = null) {
  const body = {
    success: false,
    message,
  };
  if (errors) body.errors = errors;
  return res.status(statusCode).json(body);
}

module.exports = {
  calculateAccountAge,
  calculateProfileCompleteness,
  isRecentlyActive,
  aggregateLanguages,
  findMostStarredRepo,
  successResponse,
  errorResponse,
};
