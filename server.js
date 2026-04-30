require('dotenv').config();
const path = require('path');
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const compression = require('compression');
const morgan = require('morgan');

const connectDB = require('./config/db');
const { verifyEmailConnection } = require('./config/email');
const { initCloudinary } = require('./config/cloudinary');
const logger = require('./utils/logger');
const { globalLimiter } = require('./middleware/rateLimiter.middleware');
const { errorHandler, notFound } = require('./middleware/errorHandler.middleware');

const authRoutes = require('./routes/auth.routes');
const jobRoutes = require('./routes/job.routes');
const applicationRoutes = require('./routes/application.routes');
const contactRoutes = require('./routes/contact.routes');
const contentRoutes = require('./routes/content.routes');
const dashboardRoutes = require('./routes/dashboard.routes');

const app = express();

// ── Security & Compression ─────────────────────────────────────────
app.set('trust proxy', 1);

app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

const allowedOrigins = [
  'https://www.nexohsolutions.com',
  'https://nexohsolutions.com',
  'https://nexo-hr-frontend.vercel.app',
  'http://localhost:5173',
  'http://localhost:3000',
  ...(process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',').map((o) => o.trim()) : []),
];

const corsOptions = {
  origin: (origin, cb) => {
    // Allow server-to-server requests (no origin) and listed origins
    if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
    logger.warn(`CORS: blocked origin ${origin}`);
    cb(null, false); // reject without throwing — prevents 500 errors
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

// Handle preflight requests for all routes before any other middleware
app.options('*', cors(corsOptions));
app.use(cors(corsOptions));

app.use(compression());

// ── Body parsing ───────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// ── Input sanitization ─────────────────────────────────────────────
try {
  const mongoSanitize = require('express-mongo-sanitize');
  app.use(mongoSanitize());
} catch (_) {}

try {
  const xss = require('xss-clean');
  app.use(xss());
} catch (_) {}

// ── Logging ────────────────────────────────────────────────────────
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev', {
    stream: { write: (msg) => logger.http(msg.trim()) },
  }));
}

// ── Rate limiting ──────────────────────────────────────────────────
app.use('/api', globalLimiter);

// ── Static file serving (local resume uploads) ─────────────────────
app.use(
  '/uploads',
  express.static(path.join(__dirname, 'uploads'), { maxAge: '1d' })
);

// ── Root & Health check ────────────────────────────────────────────
app.get('/', (_req, res) => {
  res.json({ message: 'NEXO HR API is running 🚀' });
});

app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    message: 'NEXO HR API is healthy',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV,
  });
});

// ── API Routes ─────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api', applicationRoutes);
app.use('/api/contacts', contactRoutes);
app.use('/api/content', contentRoutes);
app.use('/api/dashboard', dashboardRoutes);

// ── 404 & Global Error Handler ──────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

// ── Bootstrap ──────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;

const bootstrap = async () => {
  try {
    await connectDB();
    initCloudinary();
    verifyEmailConnection();

    app.listen(PORT, () => {
      logger.info(`🚀 NEXO HR API listening on port ${PORT} [${process.env.NODE_ENV}]`);
    });
  } catch (err) {
    logger.error(`Failed to start server: ${err.message}`);
    process.exit(1);
  }
};

process.on('unhandledRejection', (reason) => {
  logger.error(`Unhandled Rejection: ${reason}`);
  process.exit(1);
});

process.on('uncaughtException', (err) => {
  logger.error(`Uncaught Exception: ${err.message}`);
  process.exit(1);
});

bootstrap();

module.exports = app;
