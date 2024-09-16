const dotenv = require("dotenv");

dotenv.config({ path: "./config.env" });

const sequelize = require("./config/db");
const app = require("./app");

try {
  const sync = async () => await sequelize.sync();
  sync();
  console.log("Connection has been established successfully.");
} catch (error) {
  console.error("Unable to connect to the database:", error);
}

console.log("process.env.NODE_ENV: ", process.env.NODE_ENV);

app.listen(process.env.PORT, () => {
  console.log("listen on port: ", 3001);
});
