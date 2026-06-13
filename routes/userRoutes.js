const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const {
  validateUsername,
  validateListQuery,
  handleValidationErrors,
} = require('../middlewares/validators');

// Profile Analysis

// Analyze a GitHub user (fetch from API → compute insights → store)
router.post(
  '/:username/analyze',
  validateUsername,
  handleValidationErrors,
  userController.analyzeProfile
);

// Re-analyze an already-stored profile
router.post(
  '/:username/refresh',
  validateUsername,
  handleValidationErrors,
  userController.refreshProfile
);

// Retrieval

// List all analyzed profiles (with optional pagination & search)
router.get(
  '/',
  validateListQuery,
  handleValidationErrors,
  userController.listProfiles
);

// Get a single stored profile by username
router.get(
  '/:username',
  validateUsername,
  handleValidationErrors,
  userController.getProfile
);

// Deletion

// Remove a stored profile
router.delete(
  '/:username',
  validateUsername,
  handleValidationErrors,
  userController.deleteProfile
);

module.exports = router;
