const mongoose = require('mongoose');

const siteContentSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: [true, 'Content key is required'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    label: {
      type: String,
      required: true,
    },
    data: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('SiteContent', siteContentSchema);
