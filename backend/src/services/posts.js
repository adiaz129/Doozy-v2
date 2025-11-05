import { pool } from "../config/db.js";

export const getPostsByUserIdInDB = async (userId) => {
    try {
        const q = `SELECT * FROM posts WHERE user_id = ?`;
        const values = [userId];
        const [result] = await pool.query(q, values);

        return {success: true, message: "Successfully fetched posts from user.", body: result};
    } catch (error) {
        return {success: false, message: "Failed to fetch posts from user."};
    }
}