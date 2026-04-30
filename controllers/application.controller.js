const path = require('path');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const Application = require('../models/Application.model');
const Job = require('../models/Job.model');
const {
  sendApplicationConfirmation,
  sendApplicationNotification,
} = require('../services/email.service');
const logger = require('../utils/logger');

exports.submitApplication = asyncHandler(async (req, res) => {
  const { jobId } = req.params;

  const job = await Job.findById(jobId);
  if (!job) throw ApiError.notFound('Job not found');
  if (job.status !== 'Active') throw ApiError.badRequest('This position is no longer accepting applications');

  const { name, email, phone, experience, coverLetter } = req.body;

  const existing = await Application.findOne({
    job: jobId,
    email,
    status: { $ne: 'Withdrawn' },
  });
  if (existing) throw ApiError.conflict('You have already applied for this position');

  const resumeData = {};
  if (req.file) {
    if (process.env.USE_CLOUDINARY === 'true') {
      resumeData.url = req.file.path;
      resumeData.publicId = req.file.filename;
    } else {
      const baseUrl = `${req.protocol}://${req.get('host')}`;
      resumeData.url = `${baseUrl}/uploads/resumes/${req.file.filename}`;
    }
    resumeData.originalName = req.file.originalname;
    resumeData.size = req.file.size;
    resumeData.mimetype = req.file.mimetype;
  }

  const application = await Application.create({
    job: jobId,
    name,
    email,
    phone,
    experience: parseFloat(experience),
    coverLetter,
    resume: Object.keys(resumeData).length ? resumeData : undefined,
    ipAddress: req.ip,
  });

  await Job.findByIdAndUpdate(jobId, { $inc: { applicationsCount: 1 } });

  try {
    await Promise.all([
      sendApplicationConfirmation({ name, email, jobTitle: job.title }),
      sendApplicationNotification({
        name, email, phone, experience,
        jobTitle: job.title,
        resumeUrl: resumeData.url,
      }),
    ]);
  } catch (err) {
    logger.warn(`Email notification failed for application ${application._id}: ${err.message}`);
  }

  ApiResponse.created(res, {
    application: {
      _id: application._id,
      name: application.name,
      email: application.email,
      status: application.status,
      createdAt: application.createdAt,
    },
  }, 'Application submitted successfully');
});

exports.listApplications = asyncHandler(async (req, res) => {
  const page = Math.max(1, req.query.page || 1);
  const limit = Math.min(50, Math.max(1, req.query.limit || 20));
  const skip = (page - 1) * limit;

  const filter = {};
  if (req.query.jobId) filter.job = req.query.jobId;
  if (req.query.status) filter.status = req.query.status;
  if (req.query.search) {
    filter.$or = [
      { name: { $regex: req.query.search, $options: 'i' } },
      { email: { $regex: req.query.search, $options: 'i' } },
    ];
  }

  const [applications, total] = await Promise.all([
    Application.find(filter)
      .populate('job', 'title category status')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .select('-__v'),
    Application.countDocuments(filter),
  ]);

  ApiResponse.paginated(res, applications, {
    total, page, limit, totalPages: Math.ceil(total / limit),
  });
});

exports.getApplication = asyncHandler(async (req, res) => {
  const application = await Application.findById(req.params.id)
    .populate('job', 'title category location type status');
  if (!application) throw ApiError.notFound('Application not found');
  ApiResponse.ok(res, { application });
});

exports.updateApplicationStatus = asyncHandler(async (req, res) => {
  const { status, adminNotes } = req.body;
  const update = { status };
  if (adminNotes !== undefined) update.adminNotes = adminNotes;

  const application = await Application.findByIdAndUpdate(
    req.params.id,
    { $set: update },
    { new: true, runValidators: true }
  ).populate('job', 'title');

  if (!application) throw ApiError.notFound('Application not found');
  ApiResponse.ok(res, { application }, 'Status updated');
});

exports.getApplicationStats = asyncHandler(async (req, res) => {
  const [statusBreakdown, jobBreakdown, totalToday] = await Promise.all([
    Application.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]),
    Application.aggregate([
      { $group: { _id: '$job', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 },
      { $lookup: { from: 'jobs', localField: '_id', foreignField: '_id', as: 'job' } },
      { $unwind: '$job' },
      { $project: { jobTitle: '$job.title', count: 1 } },
    ]),
    Application.countDocuments({
      createdAt: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) },
    }),
  ]);

  const total = statusBreakdown.reduce((acc, s) => acc + s.count, 0);

  ApiResponse.ok(res, { total, totalToday, statusBreakdown, jobBreakdown });
});
