exports.generateEmailTemplate = (token) => {
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Email Confirmation</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      background-color: #f9f9f9;
      margin: 0;
      padding: 0;
    }
    .container {
      max-width: 600px;
      margin: 20px auto;
      background-color: #ffffff;
      border: 1px solid #ddd;
      border-radius: 5px;
      padding: 20px;
      text-align: center;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }
    .button {
      display: inline-block;
      margin-top: 20px;
      padding: 10px 20px;
      font-size: 16px;
      color: #ffffff;
      background-color: #007bff;
      text-decoration: none;
      border-radius: 5px;
    }
    .button:hover {
      background-color: #0056b3;
    }
    .footer {
      margin-top: 20px;
      font-size: 12px;
      color: #777;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>Confirm Your Email Address</h1>
    <p>Hello,</p>
    <p>Thank you for signing up! Please confirm your email address by clicking the button below:</p>
    <a href="http://localhost:5000/api/v1/auth/confirm?token=${token}" class="button">Confirm Email</a>
    <p>If you did not create this account, you can safely ignore this email.</p>
    <div class="footer">
      <p>© 2024 Your Company. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
`;
  return html;
};

exports.generatePasswordTemplate = (token) => {
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Password Reset</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      background-color: #f9f9f9;
      margin: 0;
      padding: 0;
    }
    .container {
      max-width: 600px;
      margin: 20px auto;
      background-color: #ffffff;
      border: 1px solid #ddd;
      border-radius: 5px;
      padding: 20px;
      text-align: center;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }
    .button {
      display: inline-block;
      margin-top: 20px;
      padding: 10px 20px;
      font-size: 16px;
      color: #ffffff;
      background-color: #007bff;
      text-decoration: none;
      border-radius: 5px;
    }
    .button:hover {
      background-color: #0056b3;
    }
    .footer {
      margin-top: 20px;
      font-size: 12px;
      color: #777;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>Reset Your Password</h1>
    <p>Hello,</p>
    <p>You recently requested to reset your password. Click the button below to reset it:</p>
    <a href="http://localhost:5000/api/v1/auth/resetPassword?token=${token}" class="button">Reset Password</a>
    <p>If you did not request this, please ignore this email. Your password will remain unchanged.</p>
    <div class="footer">
      <p>© 2024 Your Company. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
`;
  return html;
};

exports.generateTwoStepAuthTemplate = (OTP) => {
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Two-Factor Authentication</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      background-color: #f9f9f9;
      margin: 0;
      padding: 0;
    }
    .container {
      max-width: 600px;
      margin: 20px auto;
      background-color: #ffffff;
      border: 1px solid #ddd;
      border-radius: 5px;
      padding: 20px;
      text-align: center;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }
    .code {
      display: inline-block;
      margin: 20px 0;
      padding: 10px 20px;
      font-size: 24px;
      font-weight: bold;
      color: #333333;
      background-color: #f4f4f4;
      border-radius: 5px;
      border: 1px solid #ddd;
    }
    .footer {
      margin-top: 20px;
      font-size: 12px;
      color: #777;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>Two-Factor Authentication Code</h1>
    <p>Hello,</p>
    <p>Use the following code to complete your login:</p>
    <div class="code">${OTP}</div>
    <p>This code is valid for the next 10 minutes. If you did not request this, please secure your account immediately.</p>
    <div class="footer">
      <p>© 2024 Your Company. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
`;
  return html;
};

exports.generatechangePasswordConfirmTemplate = (email) => {
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Password Change Confirmation</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      background-color: #f9f9f9;
      margin: 0;
      padding: 0;
    }
    .container {
      max-width: 600px;
      margin: 20px auto;
      background-color: #ffffff;
      border: 1px solid #ddd;
      border-radius: 5px;
      padding: 20px;
      text-align: center;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }
    .button {
      display: inline-block;
      margin-top: 20px;
      padding: 10px 20px;
      font-size: 16px;
      color: #ffffff;
      background-color: #28a745;
      text-decoration: none;
      border-radius: 5px;
    }
    .button:hover {
      background-color: #218838;
    }
    .footer {
      margin-top: 20px;
      font-size: 12px;
      color: #777;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>Password Changed</h1>
    <p>Hello,</p>
    <p>We noticed that the password for your account was recently changed. If you made this change, no further action is required.</p>
    <p>If you did not change your password, please secure your account immediately by clicking the button below:</p>
    <a href="https://localhost:5000/api/v1/users/secureAccount/${email}" class="button">Secure My Account</a>
    <p>If you have any questions or concerns, please contact our support team.</p>
    <div class="footer">
      <p>© 2024 Your Company. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
`;
  return html;
};

exports.generateAccountDeactivatedTemplate = () => {
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Account Deactivated</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      background-color: #f9f9f9;
      margin: 0;
      padding: 0;
    }
    .container {
      max-width: 600px;
      margin: 20px auto;
      background-color: #ffffff;
      border: 1px solid #ddd;
      border-radius: 5px;
      padding: 20px;
      text-align: center;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }
    .button {
      display: inline-block;
      margin-top: 20px;
      padding: 10px 20px;
      font-size: 16px;
      color: #ffffff;
      background-color: #007bff;
      text-decoration: none;
      border-radius: 5px;
    }
    .button:hover {
      background-color: #0056b3;
    }
    .footer {
      margin-top: 20px;
      font-size: 12px;
      color: #777;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>Account Deactivated</h1>
    <p>Hello,</p>
    <p>We wanted to let you know that your account has been deactivated. If you requested this action, no further steps are needed.</p>
    <p>You still can retrieve your account within 30 days.</p>
    <p>If you have any questions, please don't hesitate to reach out.</p>
    <div class="footer">
      <p>© 2024 Your Company. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
`;
  return html;
};

exports.generateReactivateAccountTemplate = () => {
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Account Reactivated</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      background-color: #f9f9f9;
      margin: 0;
      padding: 0;
    }
    .container {
      max-width: 600px;
      margin: 20px auto;
      background-color: #ffffff;
      border: 1px solid #ddd;
      border-radius: 5px;
      padding: 20px;
      text-align: center;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }
    .button {
      display: inline-block;
      margin-top: 20px;
      padding: 10px 20px;
      font-size: 16px;
      color: #ffffff;
      background-color: #28a745;
      text-decoration: none;
      border-radius: 5px;
    }
    .button:hover {
      background-color: #218838;
    }
    .footer {
      margin-top: 20px;
      font-size: 12px;
      color: #777;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>Welcome Back!</h1>
    <p>Hello,</p>
    <p>We’re happy to let you know that your account has been successfully reactivated. You can now log in and continue using our services as usual.</p>
    <p>If you did not request this reactivation or have any concerns, please contact our support team immediately.</p>
    <div class="footer">
      <p>© 2024 Your Company. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
`;
  return html;
};
exports.generateOTPTemplate = (verificationCode) => {
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0;">
  <title>Verify Your Email</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(to right, #4CAF50, #45a049); padding: 20px; text-align: center;">
    <h1 style="color: white; margin: 0;">Verify Your Email</h1>
  </div>
  <div style="background-color: #f9f9f9; padding: 20px; border-radius: 0 0 5px 5px; box-shadow: 0 2px 5px rgba(0,0,0,0.1);">
    <p>Hello,</p>
    <p>Thank you for signing up! Your verification code is:</p>
    <div style="text-align: center; margin: 30px 0;">
      <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #4CAF50;">${verificationCode}</span>
    </div>
    <p>Enter this code on the verification page to complete your registration.</p>
    <p>This code will expire in 15 minutes for security reasons.</p>
    <p>If you didn't create an account with us, please ignore this email.</p>
    <p>Best regards,<br>Your Blog Team</p>
  </div>
  <div style="text-align: center; margin-top: 20px; color: #888; font-size: 0.8em;">
    <p>This is an automated message, please do not reply to this email.</p>
  </div>
</body>
</html>
`;
  return html;
};

exports.passwordResetRequestTemplate = (token) => {
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset Your Password</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(to right, #4CAF50, #45a049); padding: 20px; text-align: center;">
    <h1 style="color: white; margin: 0;">Password Reset</h1>
  </div>
  <div style="background-color: #f9f9f9; padding: 20px; border-radius: 0 0 5px 5px; box-shadow: 0 2px 5px rgba(0,0,0,0.1);">
    <p>Hello,</p>
    <p>We received a request to reset your password. If you didn't make this request, please ignore this email.</p>
    <p>To reset your password, click the button below:</p>
    <div style="text-align: center; margin: 30px 0;">
      <a href="http://localhost:5000/api/v1/auth/reset-password?token=${token}" style="background-color: #4CAF50; color: white; padding: 12px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">Reset Password</a>
    </div>
    <p>This link will expire in 1 hour for security reasons.</p>
    <p>Best regards,<br>Your Blog Team</p>
  </div>
  <div style="text-align: center; margin-top: 20px; color: #888; font-size: 0.8em;">
    <p>This is an automated message, please do not reply to this email.</p>
  </div>
</body>
</html>
`;
  return html;
};
exports.passwordResetSuccessTemplate = (userName = "User") => {
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Password Reset Successful</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(to right, #4CAF50, #45a049); padding: 20px; text-align: center;">
    <h1 style="color: white; margin: 0;">Password Reset Successful</h1>
  </div>
  <div style="background-color: #f9f9f9; padding: 20px; border-radius: 0 0 5px 5px; box-shadow: 0 2px 5px rgba(0,0,0,0.1);">
    <p>Hello ${userName},</p>
    <p>We're writing to confirm that your password has been <strong>successfully reset</strong>.</p>
    
    <div style="background-color: #e8f5e9; border-left: 4px solid #4CAF50; padding: 15px; margin: 20px 0;">
      <p style="margin: 0; color: #2e7d32;">
        <strong>✓ Password change confirmed</strong>
      </p>
    </div>
    
    <p>If you did not make this change, please contact our support team immediately.</p>
    
    <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; border-radius: 5px; padding: 15px; margin: 20px 0;">
      <h3 style="color: #856404; margin-top: 0;">Security Tips:</h3>
      <ul style="color: #856404; margin-bottom: 0;">
        <li>Use a strong, unique password</li>
        <li>Never share your password with anyone</li>
        <li>Enable two-factor authentication if available</li>
      </ul>
    </div>
    
    <p>You can now log in with your new password.</p>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="http://localhost:3000/login" style="background-color: #4CAF50; color: white; padding: 12px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">Login to Your Account</a>
    </div>
    
    <p>Best regards,<br>Your Blog Team</p>
  </div>
  <div style="text-align: center; margin-top: 20px; color: #888; font-size: 0.8em;">
    <p>This is an automated message, please do not reply to this email.</p>
  </div>
</body>
</html>`;
  return html;
};
