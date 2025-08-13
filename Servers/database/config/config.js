require("dotenv").config();

module.exports = {
  development: {
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: "postgres",
  },
  production: {
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: "postgres",
    ...(
      process.env.DB_SSL === "true" ? {
        dialectOptions: {
          ssl: {
            require: true,
            rejectUnauthorized: process.env.REJECT_UNAUTHORIZED === "true",
          },
        }
      } : {
        dialectOptions: {
          ssl: false,
        }
      }
    ),
  },
};