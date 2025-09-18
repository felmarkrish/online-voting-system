import mysql from "mysql2/promise";

export async function connectDB() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || "localhost",
    user: process.env.DB_USER || "root",      // change if needed
    password: process.env.DB_PASS || "",      // change if needed
    database: process.env.DB_NAME || "online-voting-system",
  });
  return connection;
}
