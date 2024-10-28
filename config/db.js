const Sequelize = require("sequelize");

const sequelize = new Sequelize(
  process.env.DB,
  process.env.DATABASE_USERNAME,
  process.env.DATABASE_PASSWORD,
  {
    host: process.env.HOST_DB,
    dialect: "postgres",
    define: {
      freezeTableName: true,
      underscored: true,
      quoteIdentifiers: false,
    },
  },
);

module.exports = sequelize;
