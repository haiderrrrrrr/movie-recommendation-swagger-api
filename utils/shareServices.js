const nodemailer = require("nodemailer");
const twilio = require("twilio");

let mailTransporter;
let twilioClient;

const getApiBaseUrl = () =>
  (process.env.API_BASE_URL || `http://localhost:${process.env.PORT || 5000}`).replace(/\/$/, "");

const sendEmail = ({ to, subject, html }) => {
  const { MAIL_USER, MAIL_PASS, MAIL_FROM } = process.env;

  if (!MAIL_USER || !MAIL_PASS) {
    throw new Error("Email credentials are not configured");
  }

  if (!mailTransporter) {
    mailTransporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: MAIL_USER,
        pass: MAIL_PASS,
      },
    });
  }

  return mailTransporter.sendMail({
    from: MAIL_FROM || MAIL_USER,
    to,
    subject,
    html,
  });
};

const getTwilioClient = () => {
  const { TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN } = process.env;

  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN) {
    throw new Error("Twilio credentials are not configured");
  }

  if (!twilioClient) {
    twilioClient = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
  }

  return twilioClient;
};

module.exports = {
  getApiBaseUrl,
  getTwilioClient,
  sendEmail,
};
