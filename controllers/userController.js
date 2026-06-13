const { analyzeUser } = require('../services/githubService');
const userModel = require('../models/userModel');
const { successResponse, errorResponse } = require('../utils/helpers');

/**
 * POST /api/users/:username/analyze

 * Hits the GitHub API, computes insights, and saves everything
 * to the database.  If the user already exists, updates the row.
 */
async function analyzeProfile(req, res, next) {
  try {
    const { username } = req.params;

    console.log(`Analyzing GitHub profile: ${username}`);

    // Fetch from GitHub & compute insights
    const insights = await analyzeUser(username);

    // Persist to MySQL (insert or update)
    const saved = await userModel.saveProfile(insights);

    return successResponse(res, saved, `Profile "${username}" analyzed and saved successfully`, 201);
  } catch (error) {
    next(error); // hand off to the centralized error handler
  }
}

/**
 * GET /api/users
 *
 * Returns a paginated list of all previously analyzed profiles.
 * Supports optional query params: ?page=1&limit=10&search=keyword
 */
async function listProfiles(req, res, next) {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const search = req.query.search || '';

    const result = await userModel.getAllProfiles({ page, limit, search });

    return successResponse(res, result, 'Profiles retrieved successfully');
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/users/:username
 *
 * Returns the stored analysis for a single GitHub user.
 */
async function getProfile(req, res, next) {
  try {
    const { username } = req.params;

    const profile = await userModel.getProfileByUsername(username);

    if (!profile) {
      return errorResponse(
        res,
        `No analysis found for "${username}". Analyze the profile first by POST /api/users/${username}/analyze`,
        404
      );
    }

    return successResponse(res, profile, 'Profile retrieved successfully');
  } catch (error) {
    next(error);
  }
}

/**
 * DELETE /api/users/:username
 *
 * Removes a stored profile from the database.
 */
async function deleteProfile(req, res, next) {
  try {
    const { username } = req.params;

    const deleted = await userModel.deleteProfile(username);

    if (!deleted) {
      return errorResponse(res, `No analysis found for "${username}"`, 404);
    }

    return successResponse(res, null, `Profile "${username}" deleted successfully`);
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/users/:username/refresh
 *
 * Re-analyzes a user — essentially the same as analyzeProfile
 * but semantically indicates an "update" rather than a first-time analysis.
 */
async function refreshProfile(req, res, next) {
  try {
    const { username } = req.params;

    // Check if we've ever analyzed this user before
    const existing = await userModel.getProfileByUsername(username);
    if (!existing) {
      return errorResponse(
        res,
        `No existing analysis found for "${username}". Use POST /api/users/${username}/analyze first.`,
        404
      );
    }

    console.log(`Refreshing GitHub profile: ${username}`);

    const insights = await analyzeUser(username);
    const saved = await userModel.saveProfile(insights);

    return successResponse(res, saved, `Profile "${username}" refreshed successfully`);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  analyzeProfile,
  listProfiles,
  getProfile,
  deleteProfile,
  refreshProfile,
};
