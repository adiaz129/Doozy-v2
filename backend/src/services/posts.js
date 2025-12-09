import { pool } from "../config/db.js";

export const getPostsByUserIdInDB = async (profileId, userId) => {
    try {
        const q = `SELECT p.*, COUNT(l.user_id) AS user_liked FROM posts p
                    LEFT JOIN likes l ON l.post_id = p.post_id AND l.user_id = ?
                    WHERE p.user_id = ?
                    GROUP BY p.post_id
                    ORDER BY time_posted DESC
                    LIMIT 15`;
        const values = [userId, profileId];
        const [result] = await pool.query(q, values);
        const parsedResult = result.map(post => ({
            ...post,
            user_liked: post.user_liked > 0
        }))

        return {success: true, message: "Successfully fetched posts from user.", body: parsedResult};
    } catch (error) {
        console.log(error);
        return {success: false, message: "Failed to fetch posts from user."};
    }
}

export const getAllPostsInDB = async (userId) => {
    try {
        const q = `( SELECT p.*, u.name, u.username, u.profile_pic, COUNT(l.user_id) AS user_liked FROM posts p
                    JOIN friends f ON (f.user_id1 = p.user_id AND f.user_id2 = ?)
                        OR (f.user_id1 = ? AND f.user_id2 = p.user_id)
                    JOIN users u ON p.user_id = u.user_id
                    LEFT JOIN likes l ON l.post_id = p.post_id AND l.user_id = ?
                    GROUP BY p.post_id
                    ) UNION (
                    SELECT p.*, u.name, u.username, u.profile_pic, COUNT(l.user_id) AS user_liked FROM posts p
                    JOIN users u ON p.user_id = u.user_id
                    LEFT JOIN likes l ON l.post_id = p.post_id AND l.user_id = ?
                    WHERE p.user_id = ?
                    GROUP BY p.post_id
                    ) ORDER BY time_posted DESC
                    LIMIT 10;`;
        const values = [userId, userId, userId, userId, userId];
        const [result] = await pool.query(q, values);
        const parsedResult = result.map(post => ({
            ...post,
            user_liked: post.user_liked > 0
        }))

        return {success: true, message: "Successfully fetched all posts.", body: parsedResult};

    } catch (error) {
        console.log(error)
        return {success: false, message: "Failed to fetch posts."};
    }
}

export const deletePostInDB = async (userId, postId) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        const q1 = `DELETE FROM posts WHERE user_id = ? AND post_id = ?`;
        const values1 = [userId, postId];
        await connection.query(q1, values1);
        const q2 = `UPDATE users SET post_count = post_count - 1 WHERE user_id = ?`
        const values2 = [userId];
        await connection.query(q2, values2);

        await connection.commit()
        return {success: true, message: "Successfully deleted post."};
    } catch (error) {
        console.log(error)
        await connection.rollback();
        return {success: false, message: "Failed to delete post."};
    } finally {
        connection.release();
    }
}