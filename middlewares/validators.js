const { param, query, validationResult } = require('express-validator');

/**
 * Validates the :username route parameter.
 * GitHub usernames can only contain alphanumeric characters and hyphens,
 * must not start or end with a hyphen, and are 1–39 characters long.
 */
const validateUsername = [
  param('username')
    .trim()
    .notEmpty().withMessage('Username is required')
    .matches(/^[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,37}[a-zA-Z0-9])?$/)
    .withMessage('Invalid GitHub username format'),
];

/**
 * Validates the optional query params used for listing profiles.
 */
const validateListQuery = [
  query('page')
    .optional()
    .isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('search')
    .optional()
    .trim()
    .isLength({ max: 100 }).withMessage('Search term too long'),
];

/**
 * Middleware that checks the result of the validators above.
 * If there are errors, it returns a 400 response immediately
 * instead of letting the request continue to the controller.
 */
function handleValidationErrors(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map((e) => ({
        field: e.path,
        message: e.msg,
      })),
    });
  }
  next();
}

module.exports = {
  validateUsername,
  validateListQuery,
  handleValidationErrors,
};
