const nodemailer = require("nodemailer");
const sendEmail = async (data) => {
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: false,
    auth: {
      user: process.env.EMAIL_USERNAME,
      pass: process.env.EMAIL_PASSWORD,
    },
    tls: {
      rejectUnauthorized: false,
    },
  });

  const emailInfo = {
    from: `"Abdulrahman Ibrahim" <${process.env.EMAIL_USERNAME}>`,
    to: data.email,
    subject: data.subject,
    html: data.html,
  };
  const info = await transporter.sendMail(emailInfo);
  console.log("Message sent: %s", info.messageId);
};

module.exports = { sendEmail };
