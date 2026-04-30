const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Job title is required'],
      trim: true,
      maxlength: [120, 'Title cannot exceed 120 characters'],
    },
    slug: {
      type: String,
      unique: true,
      lowercase: true,
    },
    location: {
      type: String,
      required: [true, 'Location is required'],
      trim: true,
    },
    type: {
      type: String,
      required: [true, 'Job type is required'],
      enum: {
        values: ['Full-time', 'Part-time', 'Contract', 'Hybrid', 'Remote', 'Internship'],
        message: '{VALUE} is not a valid job type',
      },
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      trim: true,
    },
    department: {
      type: String,
      trim: true,
    },
    description: {
      type: String,
      default: '',
    },
    requirements: {
      type: [String],
      default: [],
    },
    responsibilities: {
      type: [String],
      default: [],
    },
    salaryRange: {
      min: { type: Number },
      max: { type: Number },
      currency: { type: String, default: 'INR' },
      visible: { type: Boolean, default: false },
    },
    experienceRange: {
      min: { type: Number, default: 0 },
      max: { type: Number },
    },
    status: {
      type: String,
      enum: ['Active', 'Draft', 'Closed'],
      default: 'Draft',
    },
    applicationsCount: {
      type: Number,
      default: 0,
    },
    deadline: {
      type: Date,
    },
    postedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  { timestamps: true }
);

jobSchema.index({ status: 1, createdAt: -1 });
jobSchema.index({ category: 1 });
jobSchema.index({ title: 'text', description: 'text', category: 'text' });

jobSchema.pre('save', async function (next) {
  if (this.isModified('title') || this.isNew) {
    const slugify = require('slugify');
    const base = slugify(this.title, { lower: true, strict: true });
    let slug = base;
    let counter = 1;
    while (await mongoose.model('Job').exists({ slug, _id: { $ne: this._id } })) {
      slug = `${base}-${counter++}`;
    }
    this.slug = slug;
  }
  next();
});

module.exports = mongoose.model('Job', jobSchema);
