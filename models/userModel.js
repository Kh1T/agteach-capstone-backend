const { DataTypes } = require("sequelize");
const { getDigitalCode } = require("node-verification-code");
const crypto = require("crypto");
const useBcrypt = require("sequelize-bcrypt");
const AppError = require("../utils/appError");
const sendEmail = require("../utils/sendEmail");

const sequelize = require("../config/db");
const { token } = require("morgan");

const UserAccount = sequelize.define("user_account", {
  userUid: {
    type: DataTypes.UUID,
    unique: true,
    allowNull: false,
    primaryKey: true,
    defaultValue: DataTypes.UUIDV4,
  },
  email: {
    type: DataTypes.STRING(50),
    allowNull: false,
    validate: {
      isEmail: true,
    },
  },
  username: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: {
      name: "unique_username",
      msg: "Username already exists.",
    },
  },
  password: {
    type: DataTypes.STRING(60),
    allowNull: false,
    validate: {
      len: [8, 30],
    },
  },
  passwordConfirm: {
    type: DataTypes.VIRTUAL,
    allowNull: false,
    validate: {
      len: [8, 30],
      notEmpty: true,
      isMatch(value) {
        if (value !== this.password) {
          throw new AppError("Passwords do not match!", 400);
        }
      },
    },
  },
  role: {
    type: DataTypes.STRING(50),
    allowNull: false,
    defaultValue: "guest",
  },
  lastLogin: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
  createdAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
  updatedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
  emailVerifyCode: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  isVerify: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  passwordResetToken: {
    type: DataTypes.STRING,
  },
  passwordChangedAt: {
    type: DataTypes.DATE,
  },
  passwordResetExpires: {
    type: DataTypes.DATE,
  },
});

module.exports = UserAccount;

// Encrpty Password
useBcrypt(UserAccount, {
  field: "password", // secret field to hash, default: 'password'
  rounds: 12, // used to generate bcrypt salt, default: 12
  compare: "authenticate", // method used to compare secrets, default: 'authenticate'
});
// Encrpty Password & Validate Email

// Generate Code for Email Verification
UserAccount.beforeCreate(async (user) => {
  // Check if user already exists
  const verificationCode = getDigitalCode(4);
  user.emailVerifyCode = verificationCode;
});

// Send Email
UserAccount.afterCreate(async (user) => {
  const verificationCode = user.emailVerifyCode;
  await sendEmail(user, {
    subject: "Your account has been created",
    text: `Your verification code is ${verificationCode}. Please enter this code on the verification page to complete your registration.`,
  });
});

UserAccount.prototype.createPasswordResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString("hex");

  this.passwordResetToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;

  return resetToken;
};
