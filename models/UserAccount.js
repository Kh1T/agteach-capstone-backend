const { Sequelize, DataTypes } = require("sequelize");

const useBcrypt = require("sequelize-bcrypt");
const AppError = require("../utils/appError");

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
  isVerify: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
});

module.exports = UserAccount;

UserAccount.beforeCreate((user) => {
  const userEmail = user.email;
}



// Encrpty Password
useBcrypt(UserAccount, {
  field: "password", // secret field to hash, default: 'password'
  rounds: 12, // used to generate bcrypt salt, default: 12
});
