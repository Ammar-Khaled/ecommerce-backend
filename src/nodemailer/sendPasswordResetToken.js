const { sendEmail } = require("./nodemailer.config");
const { passwordResetRequestTemplate } = require("./templates");

exports.sendPasswordToken = async (user) => {
  const confirmToken = user.createResetPasswordToken();
  await user.save({ validateBeforeSave: false });
  const html = passwordResetRequestTemplate(confirmToken);
  const data = {
    email: user.email,
    subject: "Password reset",
    html,
  };
  await sendEmail(data);
};
