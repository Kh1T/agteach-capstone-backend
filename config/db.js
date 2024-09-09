const Sequelize = require("sequelize");

const sequelize = new Sequelize("agdevdb", "agdev", "agxyzdev", {
  host: "3.86.51.244",
  dialect: "postgres",
});

module.exports = sequelize;
