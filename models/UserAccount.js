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
    defaultValue: DataTypes.UUIDV4, // Use default UUID generator
  },
  email: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true, // Enforce unique emails
    validate: {
      isEmail: true, // Validates proper email format
    },
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
    type: DataTypes.VIRTUAL, // Virtual field for password confirmation
    allowNull: false, // Ensures passwordConfirm is not empty
    validate: {
      notEmpty: true,
      isMatch(value) {
        if (value !== this.password) {
          throw new Error("Passwords do not match!"); // Custom error
        }
      },
    },
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

// Encrpty Password & Validate Email

UserAccount.beforeCreate(async (user) => {
  // Check if user already exists by email
  const existingUser = await UserAccount.findOne({
    where: { email: user.email },
  });

  if (existingUser) {
    throw new AppError("Email is already in use", 400); // Throw error
  }

  // Hash the password before saving
  if (user.password) {
    user.password = await bcrypt.hash(user.password, 12);
  }
});

// Send Email
UserAccount.beforeCreate(async (user) => {});
