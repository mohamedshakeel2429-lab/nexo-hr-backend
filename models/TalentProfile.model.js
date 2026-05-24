const mongoose = require('mongoose');

const talentProfileSchema = new mongoose.Schema(
  {
    // Personal Information
    fullName: {
      type: String,
      required: [true, 'Full name is required'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    contactNumber: {
      type: String,
      required: [true, 'Contact number is required'],
      trim: true,
      match: [/^\d{10}$/, 'Contact number must be 10 digits'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Invalid email address'],
    },
    location: {
      type: String,
      required: [true, 'Current location is required'],
      trim: true,
    },

    // Professional Details
    currentOrganization: {
      type: String,
      required: [true, 'Current organization is required'],
      trim: true,
    },
    currentDesignation: {
      type: String,
      required: [true, 'Current designation is required'],
      trim: true,
    },
    totalExperience: {
      type: String,
      required: [true, 'Total experience is required'],
      enum: ['0-2', '2-5', '5-10', '10+'],
    },
    noticePeriod: {
      type: String,
      required: [true, 'Notice period is required'],
      enum: ['immediate', '15days', '30days', '60days', '90days'],
    },

    // Skills
    skill1: {
      type: String,
      required: [true, 'At least one skill is required'],
      trim: true,
    },
    skill2: {
      type: String,
      trim: true,
      default: '',
    },
    skill3: {
      type: String,
      trim: true,
      default: '',
    },

    // Role Preference
    preferredRole: {
      type: String,
      required: [true, 'Preferred role is required'],
      trim: true,
    },
    preferredLocation: {
      type: String,
      required: [true, 'Preferred location is required'],
      trim: true,
    },
    applyingFor: {
      type: String,
      trim: true,
      default: '',
    },

    // Qualification
    highestQualification: {
      type: String,
      required: [true, 'Highest qualification is required'],
      trim: true,
    },

    // Resume
    resume: {
      url: { type: String },
      publicId: { type: String },
      originalName: { type: String },
      size: { type: Number },
      mimetype: { type: String },
    },

    // Status
    status: {
      type: String,
      enum: {
        values: ['Active', 'Under Review', 'Matched', 'Contacted', 'Inactive'],
        message: '{VALUE} is not a valid status',
      },
      default: 'Active',
    },

    // Admin notes
    adminNotes: {
      type: String,
      default: '',
    },

    // IP Address for tracking
    ipAddress: {
      type: String,
    },
  },
  { timestamps: true }
);

talentProfileSchema.index({ email: 1 });
talentProfileSchema.index({ status: 1 });
talentProfileSchema.index({ createdAt: -1 });
talentProfileSchema.index({ preferredRole: 1 });

module.exports = mongoose.model('TalentProfile', talentProfileSchema);
