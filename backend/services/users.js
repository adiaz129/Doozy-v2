import { pool } from '../config/db.js';

export const getUsersFromDB = async () => {
    try {
        const q = "SELECT * FROM Users";
        const [rows] = await pool.query(q);
        return rows;
    } catch (error) {
        console.error('Error fetching users:', error);
        throw error;
    }
}