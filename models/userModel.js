const { DataTypes } = require("sequelize");
const { getDigitalCode } = require("node-verification-code");
const crypto = require("crypto");
const useBcrypt = require("sequelize-bcrypt");
const AppError = require("../utils/appError");
const sendEmail = require("../utils/sendEmail");

const sequelize = require("../config/db");

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
    minlength: 8,
    // validate: {
    //   len: {
    //     args: [8, 30],
    //     msg: "Password must be between 8 and 30 characters.",
    //   },
    // },
  },
  passwordConfirm: {
    type: DataTypes.VIRTUAL,
    allowNull: false,
    validate: {
      // len: {
      //   args: [8, 30],
      //   msg: "Password must be between 8 and 30 characters.",
      // },
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

// Generate Code for Email Verification

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

// Create email verify code & input code into DB
UserAccount.prototype.createEmailVerifyCode = function () {
  const verificationCode = getDigitalCode(4);
  this.emailVerifyCode = verificationCode;
  this.updatedAt = Date.now();
  return verificationCode;
};

// Update passwordChangeAt of the password has been changed

UserAccount.prototype.updatePasswordChangedAt = function () {
  if (this.changed("passwordChangedAt")) {
    this.passwordChangedAt = Date.now();
  }
};

// UserAccount.beforeCreate(async function (user) {
//   console.log(this);
//   // if (this.isModified("password"))
//   //   this.passwordChangedAt = Date.now() - 1000;
// });
