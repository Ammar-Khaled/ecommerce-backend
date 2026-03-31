const { sendEmail } = require("./nodemailer.config");
const { generatechangePasswordConfirmTemplate } = require("./templates");

exports.sendConfirmPasswordChangeToken = async (user) => {
  await user.createPasswordResetToken();
  await user.save();
  const html = generatechangePasswordConfirmTemplate(user.email);
  const data = {
    email: user.email,
    subject: "Confirm Password Change",
    html,
  };
  await sendEmail(data);
};
