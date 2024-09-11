const { Sequelize, DataTypes } = require("sequelize");

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
      // unique: true,
      isEmail: true,
    },
  },
  username: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true,
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
});

module.exports = UserAccount;

// Encrpty Password
useBcrypt(UserAccount, {
  field: "password", // secret field to hash, default: 'password'
  rounds: 12, // used to generate bcrypt salt, default: 12
});
// Encrpty Password & Validate Email

// Send Email
UserAccount.beforeCreate(async (user) => {
  // Send response
  const verificationCode = Math.floor(100000 + Math.random() * 900000); // 6-digit code

  //Set the verification code in the database
  user.emailVerifyCode = verificationCode;
  // Send email
  await sendEmail({
    to: user.email,
    from: process.env.EMAIL_FROM,
    subject: "Your account has been created",
    username: user.username,
    code: { verificationCode },
    text: `Your verification code is ${verificationCode}. Please enter this code on the verification page to complete your registration.`,
  });
});
