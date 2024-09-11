const { DataTypes } = require("sequelize");

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
  isVerify: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
});

module.exports = UserAccount;

UserAccount.beforeCreate(async (user) => {
  // Check if user already exists
  const existingUser = await UserAccount.findOne({
    where: { email: user.email, username: user.username },
  });

  if (existingUser) {
    throw new AppError("Email is already in use", 400);
  }
});

// Encrpty Password
useBcrypt(UserAccount, {
  field: "password", // secret field to hash, default: 'password'
  rounds: 12, // used to generate bcrypt salt, default: 12
  compare: "authenticate", // method used to compare secrets, default: 'authenticate'
});
// Encrpty Password & Validate Email

// Send Email
UserAccount.beforeCreate(async (user) => {
  // Send response
  const verificationCode = Math.floor(100000 + Math.random() * 900000); // 6-digit code
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
