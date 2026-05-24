const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const Job = require('../models/Job.model');

const buildFilter = (query, adminMode = false) => {
  const filter = {};

  if (!adminMode) {
    filter.status = 'Active';
  } else if (query.status && query.status !== 'all') {
    filter.status = query.status;
  }

  if (query.category && query.category !== 'all') filter.category = query.category;
  if (query.type && query.type !== 'all') filter.type = query.type;

  if (query.search) {
    filter.$text = { $search: query.search };
  }

  return filter;
};

exports.listPublicJobs = asyncHandler(async (req, res) => {
  const page = Math.max(1, req.query.page || 1);
  const limit = Math.min(50, Math.max(1, req.query.limit || 12));
  const skip = (page - 1) * limit;

  const filter = buildFilter(req.query, false);
  const sortField = req.query.search ? { score: { $meta: 'textScore' } } : { createdAt: -1 };

  const [jobs, total] = await Promise.all([
    Job.find(filter).sort(sortField).skip(skip).limit(limit).select('-__v'),
    Job.countDocuments(filter),
  ]);

  ApiResponse.paginated(res, jobs, {
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
    hasNext: page * limit < total,
    hasPrev: page > 1,
  });
});

exports.getPublicJob = asyncHandler(async (req, res) => {
  const job = await Job.findOne({
    $or: [{ _id: req.params.id }, { slug: req.params.id }],
    status: 'Active',
  }).select('-__v');

  if (!job) throw ApiError.notFound('Job not found');
  ApiResponse.ok(res, { job });
});

exports.listAdminJobs = asyncHandler(async (req, res) => {
  const page = Math.max(1, req.query.page || 1);
  const limit = Math.min(50, Math.max(1, req.query.limit || 20));
  const skip = (page - 1) * limit;

  const filter = buildFilter(req.query, true);

  const [jobs, total] = await Promise.all([
    Job.find(filter).sort({ updatedAt: -1 }).skip(skip).limit(limit).select('-__v'),
    Job.countDocuments(filter),
  ]);

  ApiResponse.paginated(res, jobs, {
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  });
});

exports.getAdminJob = asyncHandler(async (req, res) => {
  const job = await Job.findById(req.params.id).populate('postedBy', 'name email');
  if (!job) throw ApiError.notFound('Job not found');
  ApiResponse.ok(res, { job });
});

exports.createJob = asyncHandler(async (req, res) => {
  const job = await Job.create({ ...req.body, postedBy: req.user._id });
  ApiResponse.created(res, { job }, 'Job created successfully');
});

exports.updateJob = asyncHandler(async (req, res) => {
  const job = await Job.findByIdAndUpdate(
    req.params.id,
    { $set: req.body },
    { new: true, runValidators: true }
  );
  if (!job) throw ApiError.notFound('Job not found');
  ApiResponse.ok(res, { job }, 'Job updated successfully');
});

exports.deleteJob = asyncHandler(async (req, res) => {
  const job = await Job.findByIdAndDelete(req.params.id);
  if (!job) throw ApiError.notFound('Job not found');
  ApiResponse.noContent(res);
});

exports.toggleJobStatus = asyncHandler(async (req, res) => {
  const job = await Job.findById(req.params.id);
  if (!job) throw ApiError.notFound('Job not found');

  const next = { Active: 'Draft', Draft: 'Active', Closed: 'Active' };
  job.status = req.body.status || next[job.status];
  await job.save();

  ApiResponse.ok(res, { job }, `Job status changed to ${job.status}`);
});

exports.getJobCategories = asyncHandler(async (req, res) => {
  const categories = await Job.distinct('category', { status: 'Active' });
  ApiResponse.ok(res, { categories });
});
