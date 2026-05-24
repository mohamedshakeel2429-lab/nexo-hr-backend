const { body } = require('express-validator');

const submitProfileValidation = [
  body('fullName')
    .trim()
    .notEmpty()
    .withMessage('Full name is required')
    .isLength({ max: 100 })
    .withMessage('Full name cannot exceed 100 characters'),

  body('contactNumber')
    .trim()
    .notEmpty()
    .withMessage('Contact number is required')
    .matches(/^\d{10}$/)
    .withMessage('Contact number must be exactly 10 digits'),

  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email is required'),

  body('location')
    .trim()
    .notEmpty()
    .withMessage('Current location is required'),

  body('currentOrganization')
    .trim()
    .notEmpty()
    .withMessage('Current organization is required'),

  body('currentDesignation')
    .trim()
    .notEmpty()
    .withMessage('Current designation is required'),

  body('totalExperience')
    .notEmpty()
    .withMessage('Total experience is required')
    .isIn(['0-2', '2-5', '5-10', '10+'])
    .withMessage('Total experience must be one of: 0-2, 2-5, 5-10, 10+'),

  body('noticePeriod')
    .notEmpty()
    .withMessage('Notice period is required')
    .isIn(['immediate', '15days', '30days', '60days', '90days'])
    .withMessage('Notice period must be one of: immediate, 15days, 30days, 60days, 90days'),

  body('skill1')
    .trim()
    .notEmpty()
    .withMessage('At least one skill is required'),

  body('skill2')
    .optional()
    .trim(),

  body('skill3')
    .optional()
    .trim(),

  body('preferredRole')
    .trim()
    .notEmpty()
    .withMessage('Preferred role is required'),

  body('preferredLocation')
    .trim()
    .notEmpty()
    .withMessage('Preferred location is required'),

  body('applyingFor')
    .optional()
    .trim(),

  body('highestQualification')
    .trim()
    .notEmpty()
    .withMessage('Highest qualification is required'),
];

const updateStatusValidation = [
  body('status')
    .notEmpty()
    .withMessage('Status is required')
    .isIn(['Active', 'Under Review', 'Matched', 'Contacted', 'Inactive'])
    .withMessage('Status must be one of: Active, Under Review, Matched, Contacted, Inactive'),
];

const addNotesValidation = [
  body('adminNotes')
    .optional()
    .trim(),
];

module.exports = {
  submitProfileValidation,
  updateStatusValidation,
  addNotesValidation,
};
