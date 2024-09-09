const sequelize = require("./config/db");
const app = require("./app");

try {
  const sync = async () => await sequelize.authenticate();
  sync();
  console.log("Connection has been established successfully.");
} catch (error) {
  console.error("Unable to connect to the database:", error);
}

app.listen(3000, () => {
  console.log("listen on port: ", 3000);
});
