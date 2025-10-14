import mysql from 'mysql2/promise';

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
});

const checkConnection = async () => {
    try {
        const connection = await pool.getConnection();
        console.log("Database Connection Successful!");
        connection.release();
    } catch (error) {
        console.log("Error connecting to database");
        throw error;
    }
}

export { pool, checkConnection };