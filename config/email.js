const { Resend } = require('resend');
const logger = require('../utils/logger');

let client;

const getResendClient = () => {
  if (client) return client;
  if (!process.env.RESEND_API_KEY) {
    throw new Error('RESEND_API_KEY environment variable is not set');
  }
  client = new Resend(process.env.RESEND_API_KEY);
  return client;
};

const verifyEmailConnection = () => {
  if (!process.env.RESEND_API_KEY) {
    logger.warn('RESEND_API_KEY is not set — emails will not be sent');
    return;
  }
  logger.info('Resend email client ready');
};

module.exports = { getResendClient, verifyEmailConnection };
