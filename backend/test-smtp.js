const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: 'smtpout.secureserver.net',
  port: 465,
  secure: true,
  auth: {
    user: 'admin@orashop.in',
    pass: 'ORAglobal'
  }
});

transporter.verify((error, success) => {
  if (error) {
    console.log('❌ SMTP Error:', error.message);
  } else {
    console.log('✅ GoDaddy SMTP is ready to send emails!');
  }
  process.exit(0);
});
