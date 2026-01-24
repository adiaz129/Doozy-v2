import mysql from 'mysql2/promise';

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT,
    timezone: 'Z',
});

const checkConnection = async () => {
    try {
        const connection = await pool.getConnection();
        console.log("Database Connection Successful!");
        connection.release();
    } catch (error) {
        console.error("Error connecting to database:", error.code, error.sqlMessage, error.message);
        throw error;
    }
}

export { pool, checkConnection };