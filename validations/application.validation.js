const { body, param } = require('express-validator');

const APPLICATION_STATUSES = ['Pending', 'Reviewing', 'Shortlisted', 'Interview', 'Offered', 'Rejected', 'Withdrawn'];

const createApplicationValidation = [
  body('name').trim().notEmpty().withMessage('Full name is required').isLength({ max: 100 }),
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('phone')
    .trim()
    .notEmpty()
    .withMessage('Phone number is required')
    .matches(/^[+]?[\d\s\-().]{7,20}$/)
    .withMessage('Invalid phone number format'),
  body('experience')
    .isFloat({ min: 0, max: 60 })
    .withMessage('Experience must be between 0 and 60 years'),
  body('coverLetter').optional().isString().isLength({ max: 2000 }),
];

const updateStatusValidation = [
  body('status')
    .isIn(APPLICATION_STATUSES)
    .withMessage(`Status must be one of: ${APPLICATION_STATUSES.join(', ')}`),
  body('adminNotes').optional().isString().isLength({ max: 1000 }),
];

module.exports = { createApplicationValidation, updateStatusValidation };
