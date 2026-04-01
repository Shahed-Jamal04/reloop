import sql from 'mssql';
import dotenv from 'dotenv';

dotenv.config();

const connectionString = process.env.DB_CONNECTION_STRING;

let pool;

export async function getConnection() {
  try {
    if (!pool) {
      pool = await sql.connect(connectionString);
      console.log('✓ Database connected');
    }
    return pool;
  } catch (err) {
    console.error('✗ Database connection error:', err.message);
    throw err;
  }
}

export async function closeConnection() {
  try {
    if (pool) {
      await pool.close();
      pool = null;
      console.log('✓ Database disconnected');
    }
  } catch (err) {
    console.error('✗ Error closing database:', err.message);
  }
}

export default { getConnection, closeConnection };
