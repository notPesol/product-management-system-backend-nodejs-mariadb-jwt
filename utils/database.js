const mariadb = require("mariadb");
const { dbUsername } = process.env;

async function connectDatabase() {
  const conn = await mariadb.createConnection({
    user: dbUsername,
    database: "learn_db",
  });
  return conn;
}

async function closeConnection(conn) {
  await conn?.end();
  console.log("database closed.");
}

module.exports = {
  connectDatabase,
  closeConnection,
};
