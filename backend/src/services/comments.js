import { pool } from "../config/db.js";

export const getCommentsFromDB = async (postId) => {
    try {
        const q = `SELECT c.*, u.name, u.username, u.profile_pic FROM comments c
                    JOIN users u ON u.user_id = c.user_id
                    WHERE c.post_id = ?
                    ORDER BY c.time_commented DESC;`
        const values = [postId];
        const [result] = await pool.query(q, values);

        return {success: true, message: 'Successfully retrieved comments', body: result};
    } catch (error) {
        console.log(error);
        return {success: false, message: 'Failed to retrieve comments.'};
    }
}

export const postCommentToDB = async (postId, userId, comment) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction()
        const q1 = `INSERT INTO comments (post_id, user_id, comment) VALUES (?, ?, ?);`;
        const values1 = [postId, userId, comment.comment];
        const [result1] = await connection.query(q1, values1);

        const q2 = `UPDATE posts SET comment_count = comment_count + 1
                    WHERE post_id = ?;`;
        const q3 = `SELECT comment_count FROM posts WHERE post_id = ?;`;
        const q4 = `SELECT user_id, name, username, profile_pic FROM users WHERE user_id = ?;`;
        const values2 = [postId];
        const values3 = [userId];
        const [result2] = await connection.query(q2, values2);
        const [result3] = await connection.query(q3, values2);
        const [result4] = await connection.query(q4, values3);
        await connection.commit();
        return {success: true, message: 'Successfully posted comment.', comment_count: result3[0].comment_count, comment_id: result1.insertId, user: result4[0]};
    } catch (error) {
        console.log(error);
        return {success: false, message: 'Failed to post comment.'};
    } finally {
        connection.release();
    }
}

export const deleteCommentInDB = async (postId, commentId) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        const q1 = `DELETE FROM comments WHERE comment_id = ?;`;
        const values1 = [commentId];
        const [result1] = await connection.query(q1, values1);

        const q2 = `UPDATE posts SET comment_count = comment_count - 1 WHERE post_id = ?;`;
        const values2 = [postId];
        const [result2] = await connection.query(q2, values2);

        const q3 = `SELECT comment_count FROM posts WHERE post_id = ?`;
        const [result3] = await connection.query(q3, values2);

        await connection.commit();
        return {success: true, message: 'Successfully deleted comment.', comment_count: result3[0].comment_count};
    } catch (error) {
        console.log(error);
        return {success: false, message: 'Failed to delete comment.'};

    } finally {
        connection.release();
    }
}