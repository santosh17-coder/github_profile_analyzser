const axios = require('axios');
const {
  calculateAccountAge,
  calculateProfileCompleteness,
  isRecentlyActive,
  aggregateLanguages,
  findMostStarredRepo,
} = require('../utils/helpers');

// Base configuration for every GitHub API request
const githubApi = axios.create({
  baseURL: 'https://api.github.com',
  headers: {
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
  },
});

// If a personal access token is set, attach it so we get
// 5 000 requests / hour instead of the unauthenticated 60.
if (process.env.GITHUB_TOKEN) {
  githubApi.defaults.headers.common['Authorization'] =
    `Bearer ${process.env.GITHUB_TOKEN}`;
}

// Public functions 

/**
 * Fetch the public profile for a given GitHub username.
 *
 * @param {string} username
 * @returns {Object} The raw profile object from GitHub.
 * @throws Will throw with a descriptive message if the user is not found or the API fails.
 */
async function fetchUserProfile(username) {
  try {
    const { data } = await githubApi.get(`/users/${username}`);
    return data;
  } catch (error) {
    if (error.response && error.response.status === 404) {
      const err = new Error(`GitHub user "${username}" not found`);
      err.statusCode = 404;
      throw err;
    }
    if (error.response && error.response.status === 403) {
      const err = new Error('GitHub API rate limit exceeded. Please try again later or add a GITHUB_TOKEN in your .env file.');
      err.statusCode = 429;
      throw err;
    }
    throw new Error(`Failed to fetch GitHub profile: ${error.message}`);
  }
}

/**
 * Fetch ALL public repositories for a user (handles pagination).
 * GitHub returns a maximum of 100 repos per page, so we loop
 * until we've collected everything.
 *
 * @param {string} username
 * @returns {Array} Array of repo objects.
 */
async function fetchUserRepos(username) {
  const allRepos = [];
  let page = 1;
  const perPage = 100; // max allowed by GitHub

  while (true) {
    const { data } = await githubApi.get(`/users/${username}/repos`, {
      params: {
        per_page: perPage,
        page,
        sort: 'updated',
        direction: 'desc',
      },
    });

    allRepos.push(...data);

    // If we got fewer than perPage results, we've reached the last page
    if (data.length < perPage) break;
    page++;
  }

  return allRepos;
}

/**
 * The main function — fetches profile + repos, then crunches
 * all the derived insights into one flat object ready for storage.
 *
 * @param {string} username
 * @returns {Object} A combined insights object.
 */
async function analyzeUser(username) {
  // 1. Grab the raw data from GitHub
  const profile = await fetchUserProfile(username);
  const repos = await fetchUserRepos(username);

  // 2. Compute the derived insights
  const totalStars = repos.reduce((sum, r) => sum + r.stargazers_count, 0);
  const totalForks = repos.reduce((sum, r) => sum + r.forks_count, 0);
  const mostStarred = findMostStarredRepo(repos);
  const topLanguages = aggregateLanguages(repos);
  const accountAge = calculateAccountAge(profile.created_at);
  const avgStars = repos.length > 0
    ? parseFloat((totalStars / repos.length).toFixed(2))
    : 0;
  const followerRatio = profile.following > 0
    ? parseFloat((profile.followers / profile.following).toFixed(2))
    : profile.followers; // avoid division by zero
  const completeness = calculateProfileCompleteness(profile);
  const recentlyActive = isRecentlyActive(repos);

  // 3. Return a combined object
  return {
    username: profile.login,
    name: profile.name,
    bio: profile.bio,
    avatar_url: profile.avatar_url,
    html_url: profile.html_url,
    location: profile.location,
    company: profile.company,
    blog: profile.blog,
    email: profile.email,
    public_repos: profile.public_repos,
    public_gists: profile.public_gists,
    followers: profile.followers,
    following: profile.following,
    account_created_at: profile.created_at,
    account_age_years: accountAge,
    total_stars: totalStars,
    total_forks: totalForks,
    most_starred_repo_name: mostStarred.name,
    most_starred_repo_stars: mostStarred.stars,
    top_languages: topLanguages,
    avg_stars_per_repo: avgStars,
    follower_following_ratio: followerRatio,
    profile_completeness: completeness,
    recently_active: recentlyActive,
  };
}

module.exports = { analyzeUser };
