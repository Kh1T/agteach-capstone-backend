const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Instructor = sequelize.define('instructor', {
  instructorId: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  firstName: {
    type: DataTypes.STRING,
    // allowNull: false,
  },
  lastName: {
    type: DataTypes.STRING,
    // allowNull: false,
  },
  phone: {
    type: DataTypes.STRING,
  },
  dateOfBirth: {
    type: DataTypes.DATE,
    // allowNull: false,i
  },
  email: {
    type: DataTypes.STRING,
    // allowNull: false,
  },
  imageUrl: {
    type: DataTypes.STRING,
    // allowNull: false,
  },

  userUid: {
    type: DataTypes.UUID,
    references: {
      model: 'user_account', // Name of the referenced model
      key: 'userUid', // Key in the referenced model
    },
  },
  locationId: {
    type: DataTypes.INTEGER,
    references: {
      model: 'location', // Name of the referenced model
      key: 'locationId', // Key in the referenced model
    },
  },
  bio: {
    type: DataTypes.STRING,
  },
  address: {
    type: DataTypes.STRING,
  },
  createdAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
  updatedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },

  isRejected: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },

  isFormSubmitted: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },

  isApproved: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },

  nationalId: {
    type: DataTypes.CHAR(15),
  },

  targetProduct: {
    type: DataTypes.TEXT,
  },

  targetCourse: {
    type: DataTypes.TEXT,
  },

  profileBackground: {
    type: DataTypes.TEXT,
  },

  bankNumber: {
    type: DataTypes.CHAR(35),
  },
});

module.exports = Instructor;
