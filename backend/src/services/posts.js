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

export const getAllPostsInDB = async (userId) => {
    try {
        const q = `(SELECT p.* FROM posts p
                    JOIN friends f ON (f.user_id1 = p.user_id AND f.user_id2 = ?)
                        OR (f.user_id1 = ? AND f.user_id2 = p.user_id)
                    ) UNION (
                    SELECT * FROM posts as p
                    WHERE p.user_id = ?
                    ) ORDER BY p.time_posted DESC
                    LIMIT 10;`;
        const values = [userId, userId, userId];
        const [result] = await pool.query(q, values);

        return {success: true, message: "Successfully fetched all posts.", body: result};

    } catch (error) {
        console.log(error)
        return {success: false, message: "Failed to fetch posts."};
    }
}