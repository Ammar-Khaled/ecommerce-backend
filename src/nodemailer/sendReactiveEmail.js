const { sendEmail } = require("./nodemailer.config");
const { generateReactivateAccountTemplate } = require("./templates");

exports.sendReactiveAccount = async (user) => {
  user.isActive = true;
  user.reactiveBefore = undefined;
  //   user.lastOnline = Date.now();
  await user.save();
  const html = generateReactivateAccountTemplate();
  const data = {
    email: user.email,
    subject: "Account reactivated",
    html,
  };
  await sendEmail(data);
};
