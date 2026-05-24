const { body } = require('express-validator');

const SERVICES = ['Recruitment', 'Payroll', 'Compliance', 'Advisory'];
const CONTACT_STATUSES = ['New', 'Contacted', 'In Progress', 'Converted', 'Closed'];

const createContactValidation = [
  body('name').trim().notEmpty().withMessage('Name is required').isLength({ max: 100 }),
  body('company').trim().notEmpty().withMessage('Company name is required').isLength({ max: 150 }),
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('phone')
    .trim()
    .notEmpty()
    .withMessage('Phone number is required')
    .matches(/^[+]?[\d\s\-().]{7,20}$/)
    .withMessage('Invalid phone number format'),
  body('services')
    .optional()
    .isArray()
    .withMessage('Services must be an array'),
  body('services.*')
    .optional()
    .isIn(SERVICES)
    .withMessage(`Each service must be one of: ${SERVICES.join(', ')}`),
  body('message').optional().isString().isLength({ max: 2000 }),
];

const updateStatusValidation = [
  body('status')
    .isIn(CONTACT_STATUSES)
    .withMessage(`Status must be one of: ${CONTACT_STATUSES.join(', ')}`),
  body('adminNotes').optional().isString().isLength({ max: 1000 }),
];

module.exports = { createContactValidation, updateStatusValidation };
