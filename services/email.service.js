const { getTransporter } = require('../config/email');
const logger = require('../utils/logger');

const FROM = `"${process.env.FROM_NAME || 'NEXO HR Solutions'}" <${process.env.FROM_EMAIL || 'nexo.hrsolutions@gmail.com'}>`;
const NOTIFY_TO = process.env.NOTIFY_EMAIL || 'nexo.hrsolutions@gmail.com';

const sendMail = async (options) => {
  try {
    const info = await getTransporter().sendMail({
      from: FROM,
      ...options,
    });
    logger.info(`Email sent: ${info.messageId} → ${options.to}`);
    return info;
  } catch (err) {
    logger.error(`Email failed to ${options.to}: ${err.message}`);
    throw err;
  }
};

const sendContactConfirmation = async ({ name, email, company, services }) => {
  const serviceList = services?.length ? services.join(', ') : 'General Inquiry';
  await sendMail({
    to: email,
    subject: 'We received your enquiry – NEXO HR Solutions',
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px;border:1px solid #e2e8f0;border-radius:8px">
        <h2 style="color:#6366f1">NEXO HR Solutions</h2>
        <p>Hi <strong>${name}</strong>,</p>
        <p>Thank you for reaching out! We have received your enquiry regarding <strong>${serviceList}</strong>.</p>
        <p>One of our HR experts from ${company ? 'our team' : 'NEXO'} will get back to you within <strong>4 working hours</strong>.</p>
        <hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0"/>
        <p style="color:#6b7280;font-size:13px">NEXO HR Solutions · Chennai, India · +91 7200721109</p>
      </div>
    `,
  });
};

const sendContactNotification = async ({ name, email, company, phone, services, message }) => {
  const serviceList = services?.length ? services.join(', ') : 'None selected';
  await sendMail({
    to: NOTIFY_TO,
    subject: `[New Enquiry] ${name} – ${company}`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px;border:1px solid #e2e8f0;border-radius:8px">
        <h2 style="color:#6366f1">New Consultation Request</h2>
        <table style="width:100%;border-collapse:collapse">
          <tr><td style="padding:8px;font-weight:bold;width:140px">Name</td><td>${name}</td></tr>
          <tr><td style="padding:8px;font-weight:bold">Company</td><td>${company}</td></tr>
          <tr><td style="padding:8px;font-weight:bold">Email</td><td>${email}</td></tr>
          <tr><td style="padding:8px;font-weight:bold">Phone</td><td>${phone}</td></tr>
          <tr><td style="padding:8px;font-weight:bold">Services</td><td>${serviceList}</td></tr>
          <tr><td style="padding:8px;font-weight:bold">Message</td><td>${message || '—'}</td></tr>
        </table>
      </div>
    `,
  });
};

const sendApplicationConfirmation = async ({ name, email, jobTitle }) => {
  await sendMail({
    to: email,
    subject: `Application Received: ${jobTitle} – NEXO HR Solutions`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px;border:1px solid #e2e8f0;border-radius:8px">
        <h2 style="color:#6366f1">NEXO HR Solutions</h2>
        <p>Hi <strong>${name}</strong>,</p>
        <p>Thank you for applying for the <strong>${jobTitle}</strong> position. Your application has been successfully received.</p>
        <p>Our recruitment team will review your profile and get back to you within <strong>48 hours</strong>.</p>
        <p>If you have any questions, feel free to reply to this email or contact us at <a href="mailto:nexo.hrsolutions@gmail.com">nexo.hrsolutions@gmail.com</a>.</p>
        <hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0"/>
        <p style="color:#6b7280;font-size:13px">NEXO HR Solutions · Chennai, India · +91 7200721109</p>
      </div>
    `,
  });
};

const sendApplicationNotification = async ({ name, email, phone, experience, jobTitle, resumeUrl }) => {
  await sendMail({
    to: NOTIFY_TO,
    subject: `[New Application] ${name} → ${jobTitle}`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px;border:1px solid #e2e8f0;border-radius:8px">
        <h2 style="color:#6366f1">New Job Application</h2>
        <table style="width:100%;border-collapse:collapse">
          <tr><td style="padding:8px;font-weight:bold;width:140px">Position</td><td>${jobTitle}</td></tr>
          <tr><td style="padding:8px;font-weight:bold">Applicant</td><td>${name}</td></tr>
          <tr><td style="padding:8px;font-weight:bold">Email</td><td>${email}</td></tr>
          <tr><td style="padding:8px;font-weight:bold">Phone</td><td>${phone}</td></tr>
          <tr><td style="padding:8px;font-weight:bold">Experience</td><td>${experience} year(s)</td></tr>
          ${resumeUrl ? `<tr><td style="padding:8px;font-weight:bold">Resume</td><td><a href="${resumeUrl}">Download Resume</a></td></tr>` : ''}
        </table>
      </div>
    `,
  });
};

const sendPasswordResetEmail = async ({ email, name, resetUrl }) => {
  await sendMail({
    to: email,
    subject: 'Password Reset Request – NEXO HR Admin',
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px;border:1px solid #e2e8f0;border-radius:8px">
        <h2 style="color:#6366f1">Password Reset</h2>
        <p>Hi <strong>${name}</strong>,</p>
        <p>We received a request to reset your admin password. Click the button below to set a new password:</p>
        <div style="text-align:center;margin:32px 0">
          <a href="${resetUrl}" style="background:#6366f1;color:#fff;padding:12px 28px;border-radius:6px;text-decoration:none;font-weight:bold">Reset Password</a>
        </div>
        <p style="color:#6b7280;font-size:13px">This link expires in 15 minutes. If you did not request a password reset, please ignore this email.</p>
      </div>
    `,
  });
};

module.exports = {
  sendContactConfirmation,
  sendContactNotification,
  sendApplicationConfirmation,
  sendApplicationNotification,
  sendPasswordResetEmail,
};
