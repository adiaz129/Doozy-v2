import pool from '../db.js';

export const getUsers = async (req, res) => {
    try {
        const q = "SELECT * FROM Users";
        const [rows] = await pool.query(q);
        res.json(rows);
    } catch (error) {
        console.error('Database error:', error);
        res.status(500).json({ error: 'Database error' });
    }
}