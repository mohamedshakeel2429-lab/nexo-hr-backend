const path = require('path');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const TalentProfile = require('../models/TalentProfile.model');
const { sendCareerProfileConfirmation, sendCareerProfileNotification } = require('../services/email.service');
const logger = require('../utils/logger');

exports.submitProfile = asyncHandler(async (req, res) => {
  const {
    fullName,
    contactNumber,
    email,
    location,
    currentOrganization,
    currentDesignation,
    totalExperience,
    noticePeriod,
    skill1,
    skill2,
    skill3,
    preferredRole,
    preferredLocation,
    applyingFor,
    highestQualification,
  } = req.body;

  // Check if email already exists
  const existingProfile = await TalentProfile.findOne({ email });
  if (existingProfile) {
    throw ApiError.conflict('A profile with this email already exists');
  }

  // Prepare resume data
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

  // Create talent profile
  const talentProfile = await TalentProfile.create({
    fullName,
    contactNumber,
    email,
    location,
    currentOrganization,
    currentDesignation,
    totalExperience,
    noticePeriod,
    skill1,
    skill2: skill2 || '',
    skill3: skill3 || '',
    preferredRole,
    preferredLocation,
    applyingFor: applyingFor || '',
    highestQualification,
    resume: Object.keys(resumeData).length ? resumeData : undefined,
    ipAddress: req.ip,
  });

  // Send confirmation emails
  try {
    await Promise.all([
      sendCareerProfileConfirmation({
        fullName,
        email,
        preferredRole,
      }),
      sendCareerProfileNotification({
        fullName,
        email,
        phone: contactNumber,
        preferredRole,
        skills: { skill1, skill2, skill3 },
        location: preferredLocation,
      }),
    ]);
  } catch (err) {
    logger.warn(`Email notification failed for talent profile ${talentProfile._id}: ${err.message}`);
  }

  ApiResponse.created(res, {
    profile: {
      _id: talentProfile._id,
      fullName: talentProfile.fullName,
      email: talentProfile.email,
      status: talentProfile.status,
      createdAt: talentProfile.createdAt,
    },
  }, 'Profile submitted successfully. We will review your details and get in touch soon!');
});

exports.listProfiles = asyncHandler(async (req, res) => {
  const page = Math.max(1, req.query.page || 1);
  const limit = Math.min(50, Math.max(1, req.query.limit || 20));
  const skip = (page - 1) * limit;

  const filter = {};
  if (req.query.status) filter.status = req.query.status;
  if (req.query.preferredRole) filter.preferredRole = { $regex: req.query.preferredRole, $options: 'i' };
  if (req.query.search) {
    filter.$or = [
      { fullName: { $regex: req.query.search, $options: 'i' } },
      { email: { $regex: req.query.search, $options: 'i' } },
      { skill1: { $regex: req.query.search, $options: 'i' } },
      { skill2: { $regex: req.query.search, $options: 'i' } },
      { skill3: { $regex: req.query.search, $options: 'i' } },
    ];
  }

  const [profiles, total] = await Promise.all([
    TalentProfile.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    TalentProfile.countDocuments(filter),
  ]);

  ApiResponse.ok(res, {
    profiles,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  }, 'Talent profiles retrieved successfully');
});

exports.getProfile = asyncHandler(async (req, res) => {
  const profile = await TalentProfile.findById(req.params.id);
  if (!profile) throw ApiError.notFound('Talent profile not found');

  ApiResponse.ok(res, { profile }, 'Talent profile retrieved successfully');
});

exports.updateProfileStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;

  const profile = await TalentProfile.findByIdAndUpdate(
    req.params.id,
    { status },
    { new: true, runValidators: true }
  );

  if (!profile) throw ApiError.notFound('Talent profile not found');

  ApiResponse.ok(res, { profile }, 'Profile status updated successfully');
});

exports.addAdminNotes = asyncHandler(async (req, res) => {
  const { adminNotes } = req.body;

  const profile = await TalentProfile.findByIdAndUpdate(
    req.params.id,
    { adminNotes },
    { new: true, runValidators: true }
  );

  if (!profile) throw ApiError.notFound('Talent profile not found');

  ApiResponse.ok(res, { profile }, 'Admin notes added successfully');
});

exports.deleteProfile = asyncHandler(async (req, res) => {
  const profile = await TalentProfile.findByIdAndDelete(req.params.id);
  if (!profile) throw ApiError.notFound('Talent profile not found');

  ApiResponse.ok(res, {}, 'Talent profile deleted successfully');
});

// ═══════════════════════════════════════════════════════════════════
// SECURE RESUME DOWNLOAD - Protected by JWT authentication
// ═══════════════════════════════════════════════════════════════════
exports.downloadResume = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user._id;

  // Security: Verify user is admin (already checked by middleware)
  if (!['admin', 'superadmin'].includes(req.user.role)) {
    throw ApiError.forbidden('Only admins can download resumes');
  }

  // Fetch talent profile
  const profile = await TalentProfile.findById(id);
  if (!profile) {
    logger.warn(`Resume download attempt for non-existent talent profile: ${id} by user: ${userId}`);
    throw ApiError.notFound('Talent profile not found');
  }

  // Verify resume exists
  if (!profile.resume?.url && !profile.resume?.publicId) {
    logger.info(`No resume for talent profile: ${id}`);
    throw ApiError.notFound('Resume not found for this profile');
  }

  // Log the access for audit trail
  logger.info(`Admin ${userId} downloading resume for talent profile ${id} (${profile.fullName})`);

  // Handle Cloudinary storage
  if (process.env.USE_CLOUDINARY === 'true' && profile.resume?.publicId) {
    try {
      const cloudinary = require('cloudinary').v2;
      const resource = await cloudinary.api.resource(profile.resume.publicId);
      
      if (!resource.secure_url) {
        throw new Error('Invalid Cloudinary resource');
      }

      // Set headers for inline view
      res.setHeader('Content-Type', profile.resume.mimetype || 'application/pdf');
      res.setHeader(
        'Content-Disposition',
        `inline; filename="${profile.resume.originalName || 'resume.pdf'}"`
      );
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      
      // Redirect to Cloudinary URL (they handle the file serving)
      return res.redirect(resource.secure_url);
    } catch (err) {
      logger.error(`Cloudinary resume fetch error for ${id}: ${err.message}`);
      throw ApiError.internalServer('Failed to fetch resume from cloud storage');
    }
  }

  // Handle local file storage
  const fs = require('fs').promises;
  const fsSync = require('fs');
  
  // Security: Prevent directory traversal attacks
  const filename = path.basename(profile.resume.url);
  const resumePath = path.join(__dirname, '../uploads/resumes', filename);
  const uploadDir = path.resolve(path.join(__dirname, '../uploads/resumes'));
  const resolvedPath = path.resolve(resumePath);

  // Ensure the resolved path is within the uploads directory
  if (!resolvedPath.startsWith(uploadDir)) {
    logger.error(`Directory traversal attempt detected for path: ${resolvedPath}`);
    throw ApiError.forbidden('Invalid resume path');
  }

  // Verify file exists
  if (!fsSync.existsSync(resolvedPath)) {
    logger.warn(`Resume file not found: ${resolvedPath} for talent profile: ${id}`);
    throw ApiError.notFound('Resume file not found on server');
  }

  try {
    // Get file stats
    const stats = await fs.stat(resolvedPath);
    
    // Set headers
    res.setHeader('Content-Type', profile.resume.mimetype || 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `inline; filename="${profile.resume.originalName || 'resume.pdf'}"`
    );
    res.setHeader('Content-Length', stats.size);
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');

    // Stream file to response
    const fileStream = fsSync.createReadStream(resolvedPath);
    
    fileStream.on('error', (err) => {
      logger.error(`Error streaming resume file ${resolvedPath}: ${err.message}`);
      if (!res.headersSent) {
        res.status(500).json(ApiError.internalServer('Error reading file'));
      }
    });

    fileStream.pipe(res);
  } catch (err) {
    logger.error(`Resume download error for ${id}: ${err.message}`);
    throw ApiError.internalServer('Failed to download resume');
  }
});
