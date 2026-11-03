const nodemailer = require('nodemailer');

const emailUser = process.env.EMAIL_USER || 'awaiskamboh0810@gmail.com';
const emailPass = process.env.EMAIL_PASS || 'sprggragehcqzloo';

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true,
  auth: {
    user: emailUser,
    pass: emailPass
  },
  connectionTimeout: 8000,
  greetingTimeout: 5000,
  socketTimeout: 10000
});

transporter.emailUser = emailUser;

module.exports = transporter;
