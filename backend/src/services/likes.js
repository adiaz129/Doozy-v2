import { pool } from "../config/db.js";

export const toggleLikeInDB = async (userId, postId) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        const q1 = `SELECT COUNT(*) AS hasLiked FROM likes WHERE post_id = ? AND user_id = ?;`
        const values1 = [postId, userId]
        let q2;
        let q3;
        let user_liked;
        const [result1] = await connection.query(q1, values1)
        if (result1[0].hasLiked > 0) {
            q2 = `DELETE FROM likes WHERE post_id = ? AND user_id = ?;`
            q3 = `UPDATE posts SET like_count = like_count - 1 WHERE post_id = ?;`
            user_liked = false;
        }
        else {
            q2 = `INSERT INTO likes (post_id, user_id) VALUES (?, ?);`
            q3 = `UPDATE posts SET like_count = like_count + 1 WHERE post_id = ?;`
            user_liked = true;
        }
        const q4 = `SELECT like_count FROM posts WHERE post_id = ?`
        const values2 = [postId, userId];
        const values3 = [postId];
        const [result2] = await connection.query(q2, values2);
        const [result3] = await connection.query(q3, values3);
        const [result4] = await connection.query(q4, values3);

        await connection.commit();
        return {success: true, message: "toggled like successfully.", user_liked: user_liked, like_count: result4[0].like_count};

    } catch (error) {
        console.log(error);
        return {success: false, message: "Failed to toggle like."};
    } finally {
        connection.release();
    }
}

export const getLikesFromDB = async (postId) => {
    try {
        const q = `SELECT u.user_id, u.name, u.username, u.profile_pic FROM posts p
                    JOIN likes l ON p.post_id = l.post_id
                    JOIN users u ON l.user_id = u.user_id
                    WHERE p.post_id = ?;`
        const values = [postId];

        const [result] = await pool.query(q, values);

        return {success: true, message: "Successfully fetched user likes.", body: result};
    } catch (error) {
        console.log(error);
        return {success: false, message: "Failed to fetch user likes."};
    }
}