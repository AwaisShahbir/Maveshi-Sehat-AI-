const nodemailer = require('nodemailer');

const emailUser = process.env.EMAIL_USER || 'awaiskamboh0810@gmail.com';
const emailPass = process.env.EMAIL_PASS || 'sprggragehcqzloo';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: emailUser,
    pass: emailPass
  }
});

transporter.emailUser = emailUser;

module.exports = transporter;
