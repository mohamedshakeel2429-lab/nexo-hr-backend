const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const Contact = require('../models/Contact.model');
const {
  sendContactConfirmation,
  sendContactNotification,
} = require('../services/email.service');
const logger = require('../utils/logger');

exports.submitContact = asyncHandler(async (req, res) => {
  const { name, company, email, phone, services, message } = req.body;

  const contact = await Contact.create({
    name,
    company,
    email,
    phone,
    services: services || [],
    message,
    ipAddress: req.ip,
  });

  try {
    await Promise.all([
      sendContactConfirmation({ name, email, company, services }),
      sendContactNotification({ name, email, company, phone, services, message }),
    ]);
  } catch (err) {
    logger.warn(`Email notification failed for contact ${contact._id}: ${err.message}`);
  }

  ApiResponse.created(res, {
    contact: {
      _id: contact._id,
      name: contact.name,
      createdAt: contact.createdAt,
    },
  }, 'Your enquiry has been received. We will contact you within 4 working hours.');
});

exports.listContacts = asyncHandler(async (req, res) => {
  const page = Math.max(1, req.query.page || 1);
  const limit = Math.min(50, Math.max(1, req.query.limit || 20));
  const skip = (page - 1) * limit;

  const filter = {};
  if (req.query.status) filter.status = req.query.status;
  if (req.query.service) filter.services = req.query.service;
  if (req.query.search) {
    filter.$or = [
      { name: { $regex: req.query.search, $options: 'i' } },
      { email: { $regex: req.query.search, $options: 'i' } },
      { company: { $regex: req.query.search, $options: 'i' } },
    ];
  }

  const [contacts, total] = await Promise.all([
    Contact.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).select('-__v'),
    Contact.countDocuments(filter),
  ]);

  ApiResponse.paginated(res, contacts, {
    total, page, limit, totalPages: Math.ceil(total / limit),
  });
});

exports.getContact = asyncHandler(async (req, res) => {
  const contact = await Contact.findById(req.params.id);
  if (!contact) throw ApiError.notFound('Contact not found');
  ApiResponse.ok(res, { contact });
});

exports.updateContactStatus = asyncHandler(async (req, res) => {
  const { status, adminNotes } = req.body;
  const update = { status };
  if (adminNotes !== undefined) update.adminNotes = adminNotes;

  const contact = await Contact.findByIdAndUpdate(
    req.params.id,
    { $set: update },
    { new: true, runValidators: true }
  );

  if (!contact) throw ApiError.notFound('Contact not found');
  ApiResponse.ok(res, { contact }, 'Status updated');
});

exports.getContactStats = asyncHandler(async (req, res) => {
  const [statusBreakdown, serviceBreakdown, totalThisMonth] = await Promise.all([
    Contact.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]),
    Contact.aggregate([
      { $unwind: '$services' },
      { $group: { _id: '$services', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]),
    Contact.countDocuments({
      createdAt: {
        $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
      },
    }),
  ]);

  const total = statusBreakdown.reduce((acc, s) => acc + s.count, 0);
  ApiResponse.ok(res, { total, totalThisMonth, statusBreakdown, serviceBreakdown });
});
