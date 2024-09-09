const Sequelize = require("sequelize");
const dotenv = require("dotenv");

dotenv.config({ path: "./config.env" });

const sequelize = new Sequelize(
  process.env.DB,
  process.env.DATABASE_USERNAME,
  process.env.DATABASE_PASSWORD,
  {
    host: process.env.HOST_DB,
    dialect: "postgres",
  },
);

module.exports = sequelize;
