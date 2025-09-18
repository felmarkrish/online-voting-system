import mysql from "mysql2/promise";

// ✅ Use a single pool for the app (better performance)
const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASS || "",
  database: process.env.DB_NAME || "online-voting-system",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

/**
 * Get a connection from the pool.
 * Use try/finally with connection.release() if you manually get a connection.
 */
export async function connectDB() {
  try {
    const connection = await pool.getConnection();
    return connection;
  } catch (err) {
    console.error("Database connection failed:", err);
    throw new Error("Failed to connect to database");
  }
}

/**
 * Shortcut for simple queries without manually acquiring a connection.
 */
export async function queryDB(query, params = []) {
  try {
    const [rows] = await pool.execute(query, params);
    return rows;
  } catch (err) {
    console.error("Query error:", err);
    throw err;
  }
}

export default pool;
