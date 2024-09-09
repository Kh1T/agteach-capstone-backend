const { Sequelize, DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const UserAccount = sequelize.define(
  "UserAccount",
  {
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
  },
  {
    tableName: "user_account", // Explicitly set the table name
    timestamps: false, // Disable automatic timestamps if not needed
  },
);

module.exports = UserAccount;
