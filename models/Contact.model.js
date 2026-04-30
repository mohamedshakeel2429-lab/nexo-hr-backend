const mongoose = require('mongoose');

const contactSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    company: {
      type: String,
      required: [true, 'Company name is required'],
      trim: true,
      maxlength: [150, 'Company name cannot exceed 150 characters'],
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
    services: {
      type: [String],
      enum: ['Recruitment', 'Payroll', 'Compliance', 'Advisory'],
      default: [],
    },
    message: {
      type: String,
      maxlength: [2000, 'Message cannot exceed 2000 characters'],
      default: '',
    },
    status: {
      type: String,
      enum: {
        values: ['New', 'Contacted', 'In Progress', 'Converted', 'Closed'],
        message: '{VALUE} is not a valid status',
      },
      default: 'New',
    },
    adminNotes: {
      type: String,
      default: '',
    },
    source: {
      type: String,
      default: 'website',
    },
    ipAddress: {
      type: String,
    },
  },
  { timestamps: true }
);

contactSchema.index({ createdAt: -1 });
contactSchema.index({ status: 1 });
contactSchema.index({ email: 1 });

module.exports = mongoose.model('Contact', contactSchema);
