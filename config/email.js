const nodemailer = require('nodemailer');
const logger = require('../utils/logger');

let transporter;

const getTransporter = () => {
  if (transporter) return transporter;

  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    secure: process.env.SMTP_PORT === '465',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
    tls: { rejectUnauthorized: process.env.NODE_ENV === 'production' },
  });

  return transporter;
};

const verifyEmailConnection = async () => {
  try {
    await getTransporter().verify();
    logger.info('Email SMTP connection verified');
  } catch (err) {
    logger.warn(`Email SMTP verification failed: ${err.message}`);
  }
};

module.exports = { getTransporter, verifyEmailConnection };
