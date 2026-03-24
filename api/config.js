export const config = {
  connectionString: process.env.DB_CONNECTION_STRING,
  options: {
    encrypt: true,
    trustServerCertificate: true,
  },
};