const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const ApiError = require('../utils/ApiError');

const MAX_SIZE_MB = parseInt(process.env.UPLOAD_MAX_SIZE_MB || '10', 10);
const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;

const allowedMimeTypes = ['application/pdf'];

const diskStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../uploads/resumes'));
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `resume_${uuidv4()}${ext}`);
  },
});

const fileFilter = (req, file, cb) => {
  if (!allowedMimeTypes.includes(file.mimetype)) {
    return cb(ApiError.badRequest('Only PDF files are accepted for resumes'), false);
  }
  cb(null, true);
};

const getStorage = () => {
  if (process.env.USE_CLOUDINARY === 'true') {
    const { cloudinary } = require('../config/cloudinary');
    const { CloudinaryStorage } = require('multer-storage-cloudinary');
    return new CloudinaryStorage({
      cloudinary,
      params: {
        folder: 'nexo-hr/resumes',
        resource_type: 'raw',
        format: 'pdf',
        public_id: () => `resume_${uuidv4()}`,
      },
    });
  }
  return diskStorage;
};

const upload = multer({
  storage: getStorage(),
  fileFilter,
  limits: { fileSize: MAX_SIZE_BYTES },
});

const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return next(ApiError.badRequest(`File size cannot exceed ${MAX_SIZE_MB}MB`));
    }
    return next(ApiError.badRequest(err.message));
  }
  next(err);
};

module.exports = { upload, handleMulterError };
