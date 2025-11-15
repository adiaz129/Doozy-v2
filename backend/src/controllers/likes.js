import { toggleLikeInDB, getLikesFromDB } from '../services/likes.js'

export const toggleLike = async (req, res) => {
    try {
        const userId = req.user.uid;
        const postId = req.params.post_id;
        const response = await toggleLikeInDB(userId, postId);
        if (response.success) {
            return res.status(200).json(response);
        }
        else {
            return res.status(400).json(response);
        }
    } catch (error) {
        console.error('Database error:', error);
        res.status(500).json({ error: 'Database error' })
    }
}

export const getLikes = async (req, res) => {
    try {
        const postId = req.params.post_id;
        const response = await getLikesFromDB(postId);
        if (response.success) {
            return res.status(200).json(response);
        }
        else {
            return res.status(400).json(response);
        }
    } catch (error) {
        console.error('Database error:', error);
        res.status(500).json({ error: 'Database error' })
    }
}