const { User, SellerProfile, RevokedToken } = require("../data/models");
const { getNextId } = require("../data/store");
const crypto = require("crypto");
const { JWT_EXPIRES_IN, signAccessToken, getTokenFromRequest, verifyAccessToken } = require("../utils/jwt.utils");
const { sendVerificationEmailOTP } = require("../nodemailer/sendVerificationEmailOTP");
const { sendPasswordToken } = require("../nodemailer/sendPasswordResetToken");
const { sendPasswordResetSuccess } = require("../nodemailer/sendPasswordResetSuccess");

const VALID_ROLES = ["customer", "seller", "admin"];

const sanitizeUser = (userDoc) => {
  if (!userDoc) {
    return null;
  }

  const user = userDoc.toObject ? userDoc.toObject() : userDoc;
  delete user.__v;
  delete user._id;
  delete user.password;
  return user;
};

const register = async (req, res) => {
  const { name, email, phone, password, confirmPassword, role = "customer" } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ message: "name, email, and password are required" });
  }

  if (confirmPassword !== undefined && password !== confirmPassword) {
    return res.status(400).json({ message: "password and confirmPassword must match" });
  }

  const normalizedEmail = String(email).toLowerCase();
  const existing = await User.findOne({ email: normalizedEmail }).lean();
  if (existing) {
    return res.status(409).json({ message: "Email already exists" });
  }

  const normalizedRole = VALID_ROLES.includes(role) ? role : "customer";
  const isSellerRegistration = normalizedRole === "seller";

  const newUser = await User.create({
    id: await getNextId(User),
    name,
    email: normalizedEmail,
    phone: phone || null,
    password,
    confirmPassword: confirmPassword || password,
    role: normalizedRole,
    sellerInfo: isSellerRegistration
      ? {
          isApproved: false,
          approvalStatus: "pending",
          requestedAt: new Date(),
          approvedAt: null,
        }
      : {
          isApproved: false,
          approvalStatus: "none",
          requestedAt: null,
          approvedAt: null,
        },
    address: null,
    paymentDetails: [],
    wishlist: [],
    isActive: !isSellerRegistration,
    isDeleted: false,
  });

  if (isSellerRegistration) {
    await SellerProfile.create({
      id: await getNextId(SellerProfile),
      userId: newUser.id,
      storeName: `${name} Store`,
      payoutMethod: "pending",
      isApproved: false,
    });
  }

  const token = signAccessToken(newUser);

  try {
    const verificationCode = newUser.createOTP();
    await newUser.save({ validateBeforeSave: false });
    await sendVerificationEmailOTP(newUser, verificationCode);
  } catch (emailError) {
    console.error("Failed to send verification OTP:", emailError);
  }

  return res.status(201).json({
    message: isSellerRegistration ? "Seller account created. Please verify your email and wait for admin approval." : "User registered successfully. Please verify your email.",
    requiresEmailVerification: true,
    requiresAdminApproval: isSellerRegistration,
    token,
    tokenType: "Bearer",
    expiresIn: JWT_EXPIRES_IN,
    user: sanitizeUser(newUser),
  });
};

const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "email and password are required" });
  }

  const user = await User.findOne({
    email: String(email).toLowerCase(),
    isDeleted: false,
  });

  if (!user || !user.password) {
    return res.status(401).json({ message: "Invalid credentials or inactive account" });
  }

  const isValidPassword = await user.comparePassword(password);
  if (!isValidPassword) {
    return res.status(401).json({ message: "Invalid credentials or inactive account" });
  }

  if (!user.isVerified) {
    return res.status(403).json({
      message: "Please verify your email before logging in",
      requiresEmailVerification: true,
      email: user.email,
    });
  }

  if (!user.isActive) {
    if (user.role === "seller") {
      return res.status(403).json({
        message: "Seller account is pending admin approval.",
        requiresAdminApproval: true,
      });
    }

    return res.status(403).json({ message: "This account is inactive." });
  }

  await User.updateOne({ id: user.id }, { $set: { lastLogin: new Date() } });

  const token = signAccessToken(user);

  return res.json({
    message: "Login successful",
    token,
    tokenType: "Bearer",
    expiresIn: JWT_EXPIRES_IN,
    user: sanitizeUser(user),
  });
};

const logout = async (req, res) => {
  const token = getTokenFromRequest(req);
  if (!token) {
    return res.status(400).json({ message: "No token provided" });
  }

  try {
    verifyAccessToken(token);

    await RevokedToken.create({ token });

    return res.json({ message: "Logged out" });
  } catch (error) {
    if (error && error.name === "TokenExpiredError") {
      return res.json({ message: "Token already expired)" });
    }
    // JsonWebTokenError
    return res.status(400).json({ message: "Invalid token" });
  }
};
const verifyEmail = async (req, res) => {
  const { email, code } = req.body;
  if (!email || !code) {
    return res.status(400).json({ message: "Email and verification code are required" });
  }

  const user = await User.findOne({
    email: String(email).toLowerCase(),
    OTP: String(code),
    OTPExpires: { $gt: Date.now() },
  });

  if (!user) {
    return res.status(400).json({ message: "Invalid or expired verification code" });
  }

  user.isVerified = true;
  user.OTP = undefined;
  user.OTPExpires = undefined;
  await user.save();

  return res.status(200).json({
    message: "Email verified successfully",
    user: sanitizeUser(user),
  });
};

/**
 * @desc    Forgot password - send reset token
 * @route   POST /api/auth/forgot-password
 * @method  POST
 * @access  Public
 */
const forgotPassword = async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: "email is required" });
  }

  const user = await User.findOne({ email: String(email).toLowerCase() });

  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  await sendPasswordToken(user);

  return res.status(200).json({ message: "Password reset link sent to your email" });
};

/**
 * @desc    Reset password using token
 * @route   PUT /api/auth/reset-password/:token
 * @method  PUT
 * @access  Public
 */
const resetPassword = async (req, res) => {
  const token = req.params.token || req.body.token;
  const { password, confirmPassword } = req.body;

  if (!token) {
    return res.status(400).json({ message: "Reset token is required" });
  }

  if (!password || !confirmPassword) {
    return res.status(400).json({ message: "Password and confirm password are required" });
  }

  if (password !== confirmPassword) {
    return res.status(400).json({ message: "Password and confirmPassword must match" });
  }

  const resetToken = crypto.createHash("sha256").update(token).digest("hex");
  const user = await User.findOne({
    resetPasswordToken: resetToken,
    resetPasswordExpiresAt: { $gt: Date.now() },
  });

  if (!user) {
    return res.status(400).json({ message: "Invalid or expired reset token" });
  }

  user.password = password;
  user.confirmPassword = confirmPassword;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpiresAt = undefined;
  await user.save();

  try {
    await sendPasswordResetSuccess(user);
  } catch (emailError) {
    console.error("Failed to send password reset success email:", emailError);
  }

  return res.status(200).json({ message: "Password reset successfully" });
};

/**
 * @desc    Check if user is logged in
 * @route   GET /api/auth/check-auth
 * @method  GET
 * @access  Private/User
 */
const checkAuth = async (req, res) => {
  if (!req.actor || !req.actor.isAuthenticated || !req.actor.user) {
    return res.status(401).json({ message: "You have to be logged in" });
  }

  return res.status(200).json({
    message: "User is logged in",
    user: sanitizeUser(req.actor.user),
  });
};

module.exports = {
  register,
  login,
  logout,
  verifyEmail,
  forgotPassword,
  resetPassword,
  checkAuth,
};
