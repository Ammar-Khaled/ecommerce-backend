const { sendEmail } = require("./nodemailer.config");
const { generateEmailTemplate } = require("./templates");

exports.sendVerificationEmailToken = async (user) => {
  const confirmToken = user.createEmailConfirmationToken();
  await user.save({ validateBeforeSave: false });
  const html = generateEmailTemplate(confirmToken);
  const data = {
    email: user.email,
    subject: "Verify Your Email - Registration Confirmation",
    html,
  };
  await sendEmail(data);
};
