const mongoose = require('mongoose');

const applicationSchema = new mongoose.Schema(
  {
    job: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Job',
      required: [true, 'Job reference is required'],
    },
    name: {
      type: String,
      required: [true, 'Applicant name is required'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Invalid email address'],
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      trim: true,
    },
    experience: {
      type: Number,
      required: [true, 'Years of experience is required'],
      min: [0, 'Experience cannot be negative'],
      max: [60, 'Experience value seems too high'],
    },
    coverLetter: {
      type: String,
      maxlength: [2000, 'Cover letter cannot exceed 2000 characters'],
      default: '',
    },
    resume: {
      url: { type: String },
      publicId: { type: String },
      originalName: { type: String },
      size: { type: Number },
      mimetype: { type: String },
    },
    status: {
      type: String,
      enum: {
        values: ['Pending', 'Reviewing', 'Shortlisted', 'Interview', 'Offered', 'Rejected', 'Withdrawn'],
        message: '{VALUE} is not a valid status',
      },
      default: 'Pending',
    },
    adminNotes: {
      type: String,
      default: '',
    },
    ipAddress: {
      type: String,
    },
  },
  { timestamps: true }
);

applicationSchema.index({ status: 1 });
applicationSchema.index({ createdAt: -1 });
applicationSchema.index(
  { job: 1, email: 1 },
  { unique: true, partialFilterExpression: { status: { $ne: 'Withdrawn' } } }
);

module.exports = mongoose.model('Application', applicationSchema);
