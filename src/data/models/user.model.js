const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");

const userSchema = new mongoose.Schema(
  {
    id: { type: Number, required: true, unique: true, index: true },
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone: { type: String, default: null },
    password: { type: String, default: null },
    confirmPassword: {
      type: String,
      required: false,
      select: false,
      validate: {
        validator: function (el) {
          if (el === undefined || el === null) {
            return true;
          }
          return el === this.password;
        },
        message: "Passwords does not match",
      },
    },
    role: {
      type: String,
      enum: ["customer", "seller", "admin"],
      default: "customer",
    },
    sellerInfo: {
      isApproved: { type: Boolean, default: false },
      approvalStatus: {
        type: String,
        enum: ["none", "pending", "approved", "rejected"],
        default: "none",
      },
      requestedAt: { type: Date, default: null },
      approvedAt: { type: Date, default: null },
    },
    profilePicture: {
      fileId: String,
      imagePath: {
        type: String,
        default: "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_640.png",
      },
    },
    address: { type: String, default: null },
    paymentDetails: { type: [mongoose.Schema.Types.Mixed], default: [] },
    wishlist: { type: [Number], default: [] },
    isActive: { type: Boolean, default: true },
    isDeleted: { type: Boolean, default: false },
    lastLogin: {
      type: Date,
      default: Date.now,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    verificationToken: {
      type: String,
      default: undefined,
    },
    verificationTokenExpiresAt: {
      type: Date,
      default: undefined,
    },
    passwordChangedAt: Date,
    resetPasswordToken: String,
    resetPasswordExpiresAt: Date,
    OTP: String,
    OTPExpires: Date,
    provider: {
      type: String,
      enum: ["local", "google", "facebook"],
      default: "local",
    },
    googleId: String,
    facebookId: String,
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } },
);

// compare the password
userSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// hash the password before saving
userSchema.pre("save", async function () {
  if (this.isModified("password")) {
    this.password = await bcrypt.hash(this.password, 12);
    this.confirmPassword = undefined;
  }

  if (this.isModified("password") && !this.isNew) {
    this.passwordChangedAt = Date.now() - 1000;
  }
});

// to check if the password was changed
userSchema.methods.changedPasswordAfter = function (JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(this.passwordChangedAt.getTime() / 1000, 10);
    return JWTTimestamp < changedTimestamp;
  }
  return false;
};

userSchema.methods.createEmailConfirmationToken = function () {
  const token = crypto.randomBytes(32).toString("hex");
  const encoded = crypto.createHash("sha256").update(token).digest("hex");
  this.verificationToken = encoded;
  this.verificationTokenExpiresAt = Date.now() + 10 * 60 * 1000;
  return token;
};

// create a reset token
userSchema.methods.createResetPasswordToken = function () {
  // Generate reset token
  const resetToken = crypto.randomBytes(32).toString("hex");
  this.resetPasswordToken = crypto.createHash("sha256").update(resetToken).digest("hex");
  this.resetPasswordExpiresAt = Date.now() + 1 * 60 * 60 * 1000; // 1 hour
  return resetToken;
};
userSchema.methods.createOTP = function () {
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  this.OTP = otp;
  this.OTPExpires = Date.now() + 15 * 60 * 1000; // 15 minutes
  return otp;
};
module.exports = mongoose.model("User", userSchema);
