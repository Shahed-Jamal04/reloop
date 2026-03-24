import sql from 'mssql/msnodesqlv8.js';

const config = {
  connectionString: "Driver={ODBC Driver 17 for SQL Server};Server=localhost\\SQLEXPRESS;Database=Reloop;Trusted_Connection=yes;TrustServerCertificate=yes;",
  connectionTimeout: 30000,
  requestTimeout: 30000,
};

let pool;

export async function getConnection() {
  try {
    if (!pool) {
      pool = await sql.connect(config);
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
