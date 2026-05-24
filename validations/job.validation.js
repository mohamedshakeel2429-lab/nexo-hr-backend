const { body, query } = require('express-validator');

const JOB_TYPES = ['Full-time', 'Part-time', 'Contract', 'Hybrid', 'Remote', 'Internship'];

const createJobValidation = [
  body('title').trim().notEmpty().withMessage('Title is required').isLength({ max: 120 }).withMessage('Title cannot exceed 120 characters'),
  body('location').trim().notEmpty().withMessage('Location is required'),
  body('type').isIn(JOB_TYPES).withMessage(`Type must be one of: ${JOB_TYPES.join(', ')}`),
  body('category').trim().notEmpty().withMessage('Category is required'),
  body('description').optional().isString(),
  body('requirements').optional().isArray(),
  body('responsibilities').optional().isArray(),
  body('status').optional().isIn(['Active', 'Draft', 'Closed']).withMessage('Invalid status'),
  body('experienceRange.min').optional().isInt({ min: 0 }),
  body('experienceRange.max').optional().isInt({ min: 0 }),
  body('deadline').optional().isISO8601().toDate(),
];

const updateJobValidation = [
  body('title').optional().trim().notEmpty().isLength({ max: 120 }),
  body('location').optional().trim().notEmpty(),
  body('type').optional().isIn(JOB_TYPES),
  body('category').optional().trim().notEmpty(),
  body('description').optional().isString(),
  body('requirements').optional().isArray(),
  body('responsibilities').optional().isArray(),
  body('status').optional().isIn(['Active', 'Draft', 'Closed']),
  body('experienceRange.min').optional().isInt({ min: 0 }),
  body('experienceRange.max').optional().isInt({ min: 0 }),
  body('deadline').optional().isISO8601().toDate(),
];

const listJobsValidation = [
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('limit').optional().isInt({ min: 1, max: 50 }).toInt(),
  query('status').optional().isIn(['Active', 'Draft', 'Closed', 'all']),
  query('category').optional().isString(),
  query('type').optional().isIn([...JOB_TYPES, 'all']),
  query('search').optional().isString().trim(),
];

module.exports = { createJobValidation, updateJobValidation, listJobsValidation };
