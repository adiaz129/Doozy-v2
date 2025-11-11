import { pool } from '../config/db.js';

export const getUserFromDB = async (userId) => {
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

export const getUsersFromSearchFromDB = async (userId, searchQuery) => {
    try {
        const q = `SELECT u.user_id, u.name, u.username, u.profile_pic,
                    CASE
                        WHEN f.user_id1 IS NOT NULL THEN 'friends'
                        WHEN r.requesting_id = ? THEN 'userSentRequest'
                        WHEN r.receiving_id = ? THEN 'userReceivedRequest'
                        ELSE 'stranger'
                    END AS friendStatus
                    FROM users u
                    LEFT JOIN friends f ON (f.user_id1 = ? AND f.user_id2 = u.user_id) OR (f.user_id1 = u.user_id AND f.user_id2 = ?)
                    LEFT JOIN requests r ON (r.requesting_id = ? AND r.receiving_id = u.user_id) OR (r.requesting_id = u.user_id AND r.receiving_id = ?)
                    WHERE (u.name LIKE CONCAT(?, '%') OR u.username LIKE CONCAT(?, '%')) AND u.user_id != ?;`;
        const values = [userId, userId, userId, userId, userId, userId, searchQuery, searchQuery, userId];
        const [result] = await pool.query(q, values);
        console.log(result)
        return {success: true, message: 'Successful search query.', body: result};
    } catch (error) {
        console.log(error);
        return {success: false, message: 'Failed search query.'};
    }
}