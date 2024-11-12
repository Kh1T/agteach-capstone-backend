const { DataTypes } = require('sequelize');
const { getDigitalCode } = require('node-verification-code');
const crypto = require('crypto');
const useBcrypt = require('sequelize-bcrypt');
const AppError = require('../utils/appError');

const sequelize = require('../config/db');

const UserAccount = sequelize.define('user_account', {
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
    unique: {
      name: 'unique_email',
      msg: 'Email already exists.',
      statusCode: 400,
    },
  },
  username: {
    type: DataTypes.STRING(50),
    allowNull: false,
    validate: {
      notEmpty: {
        name: 'unique_username',
        msg: 'Username cannot be empty.',
      },
    },
    unique: {
      name: 'unique_username',
      msg: 'Username already exists.',
    },
  },
  password: {
    type: DataTypes.STRING(60),
    allowNull: false,
    minlength: 8,
    validate: {
      notEmpty: true,
    },
  },
  passwordConfirm: {
    type: DataTypes.VIRTUAL,
    allowNull: false,
    validate: {
      notEmpty: true,
      isMatch(value) {
        if (value !== this.password) {
          throw new AppError('Passwords do not match!', 400);
        }
      },
    },
  },
  role: {
    type: DataTypes.STRING(50),
    allowNull: false,
    defaultValue: 'guest',
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
  field: 'password', // secret field to hash, default: 'password'
  rounds: 12, // used to generate bcrypt salt, default: 12
  compare: 'authenticate', // method used to compare secrets, default: 'authenticate'
});

UserAccount.prototype.createPasswordResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString('hex');

  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;

  return resetToken;
};

// Create email verify code
UserAccount.prototype.createEmailVerifyCode = async function () {
  const verificationCode = getDigitalCode(6).toString('utf8');
  this.emailVerifyCode = verificationCode;

  this.updatedAt = new Date();
  await this.save();
  return verificationCode;
};

// Update passwordChangeAt of the password has been changed

UserAccount.prototype.updatePasswordChangedAt = function () {
  if (this.changed('passwordChangedAt')) {
    this.passwordChangedAt = Date.now();
  }
};
