import { getCommentsFromDB, postCommentToDB, deleteCommentInDB } from "../services/comments.js";

export const getComments = async (req, res) => {
    try {
        const postId = req.params.post_id;
        const response = await getCommentsFromDB(postId);
        if (response.success) {
            return res.status(200).json(response);
        }
        else {
            return res.status(400).json(response);
        }
    } catch (error) {
        console.error('Database error:', error);
        return res.status(500).json({ error: 'Database error' });
    }
}

export const postComment = async (req, res) => {
    try {
        const postId = req.params.post_id;
        const userId = req.user.uid;
        const comment = req.body;
        const response = await postCommentToDB(postId, userId, comment);
        if (response.success) {
            return res.status(200).json(response);
        }
        else {
            return res.status(400).json(response);
        }
    } catch (error) {
        console.error('Database error:', error);
        return res.status(500).json({ error: 'Database error' });
    }
}

export const deleteComment = async (req, res) => {
    try {
        const postId = req.params.post_id;
        const commentId = req.params.comment_id;
        const response = await deleteCommentInDB(postId, commentId);
        if (response.success) {
            return res.status(200).json(response);
        }
        else {
            return res.status(400).json(response);
        }
    } catch (error) {
        console.error('Database error:', error);
        return res.status(500).json({ error: 'Database error' });
    }
}