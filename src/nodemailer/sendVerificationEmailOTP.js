const { sendEmail } = require("./nodemailer.config");
const { generateOTPTemplate } = require("./templates");

exports.sendVerificationEmailOTP = async (user, token) => {
  const html = generateOTPTemplate(token);
  const data = {
    email: user.email,
    subject: "Verify Your Email - Registration Confirmation",
    html,
  };
  await sendEmail(data);
};
