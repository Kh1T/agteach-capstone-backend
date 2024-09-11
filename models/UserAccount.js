const { Sequelize, DataTypes } = require("sequelize");
const bcrypt = require("bcryptjs");
const AppError = require("../utils/appError");

const sequelize = require("../config/db");

const UserAccount = sequelize.define("user_account", {
  user_uid: {
    type: DataTypes.UUID,
    unique: true,
    allowNull: false,
    primaryKey: true,
    autoIncrement: true,
  },
  email: {
    type: DataTypes.STRING(50),
    allowNull: false,
  },
  username: {
    type: DataTypes.STRING(50),
    allowNull: false,
  },
  password: {
    type: DataTypes.STRING(60),
    allowNull: false,
  },
  passwordConfirm: {
    type: DataTypes.VIRTUAL(DataTypes.STRING(50)),
  },
  role: {
    type: DataTypes.STRING(50),
    allowNull: false,
  },
  last_login: {
    type: DataTypes.DATE,
    defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
  },
  updated_at: {
    type: DataTypes.DATE,
    defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
  },
  is_verify: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
});

module.exports = UserAccount;

UserAccount.beforeCreate(async (user) => {
  // Check if passwords match
  if (user.password !== user.passwordConfirm) {
    return new AppError("Passwords do not match!", 400);
  }

  // Check if user already exists
  const existingUser = await UserAccount.findByPk(user.email);

  if (existingUser) {
    return new AppError("Email is already in use", 400);
  }
  if (user.password) {
    user.password = await bcrypt.hash(user.password, 12);
  }
});
