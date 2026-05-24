const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const ApiError = require('../utils/ApiError');

const MAX_SIZE_MB = parseInt(process.env.UPLOAD_MAX_SIZE_MB || '10', 10);
const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;

<<<<<<< HEAD
const pdfMimeTypes = ['application/pdf'];
const resumeMimeTypes = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'image/jpeg',
  'image/png',
];

const allowedExtensions = ['.pdf', '.doc', '.docx', '.jpg', '.jpeg', '.png'];
=======
const allowedMimeTypes = ['application/pdf'];
>>>>>>> b0fd75f9e40ec998ec13d4ce02ac3f62550a3418

const diskStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../uploads/resumes'));
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `resume_${uuidv4()}${ext}`);
  },
});

<<<<<<< HEAD
const createFileFilter = (allowedMimeTypes, message) => (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  if (!allowedMimeTypes.includes(file.mimetype) && !allowedExtensions.includes(ext)) {
    return cb(ApiError.badRequest(message), false);
  }
  cb(null, true);
};

const pdfFileFilter = (req, file, cb) => {
  if (!pdfMimeTypes.includes(file.mimetype)) {
=======
const fileFilter = (req, file, cb) => {
  if (!allowedMimeTypes.includes(file.mimetype)) {
>>>>>>> b0fd75f9e40ec998ec13d4ce02ac3f62550a3418
    return cb(ApiError.badRequest('Only PDF files are accepted for resumes'), false);
  }
  cb(null, true);
};

<<<<<<< HEAD
const anyResumeFileFilter = createFileFilter(
  resumeMimeTypes,
  'Only PDF, DOC, DOCX, JPG, and PNG files are accepted for resumes'
);

const getStorage = (forcePdfFormat = false) => {
=======
const getStorage = () => {
>>>>>>> b0fd75f9e40ec998ec13d4ce02ac3f62550a3418
  if (process.env.USE_CLOUDINARY === 'true') {
    const { cloudinary } = require('../config/cloudinary');
    const { CloudinaryStorage } = require('multer-storage-cloudinary');
    return new CloudinaryStorage({
      cloudinary,
      params: {
        folder: 'nexo-hr/resumes',
        resource_type: 'raw',
<<<<<<< HEAD
        ...(forcePdfFormat ? { format: 'pdf' } : {}),
=======
        format: 'pdf',
>>>>>>> b0fd75f9e40ec998ec13d4ce02ac3f62550a3418
        public_id: () => `resume_${uuidv4()}`,
      },
    });
  }
  return diskStorage;
};

const upload = multer({
<<<<<<< HEAD
  storage: getStorage(true),
  fileFilter: pdfFileFilter,
  limits: { fileSize: MAX_SIZE_BYTES },
});

const uploadAnyResume = multer({
  storage: getStorage(false),
  fileFilter: anyResumeFileFilter,
=======
  storage: getStorage(),
  fileFilter,
>>>>>>> b0fd75f9e40ec998ec13d4ce02ac3f62550a3418
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

<<<<<<< HEAD
module.exports = { upload, uploadAnyResume, handleMulterError };
=======
module.exports = { upload, handleMulterError };
>>>>>>> b0fd75f9e40ec998ec13d4ce02ac3f62550a3418
