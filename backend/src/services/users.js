import { pool } from '../config/db.js';

export const getUserFromDB = async (userId, currUserId) => {
    try {
        const q = "SELECT user_id, name, username, profile_pic, bio, post_count, friend_count FROM Users WHERE user_id = ?";
        const values = [userId];
        const [result] = await pool.query(q, values);
        return {success: true, message: 'Get user request successful.', body: result};
    } catch (error) {
        console.error('Error fetching users:', error);
        throw error;
    }
}