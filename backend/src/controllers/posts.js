import { getPostsByUserIdInDB, getAllPostsInDB } from "../services/posts.js";


export const getPostsByUserId = async (req, res) => {
    try {
        const profileId = req.params.user_id;
        const userId = req.user.uid;

        if (req.friendStatus !== "friend" && req.friendStatus !== "currentUser") {
            return res.status(403).json({ error: "Forbidden" });
        }
        const response = await getPostsByUserIdInDB(profileId, userId);
        if (response.success) {
            return res.status(200).json(response);
        }
        else {
            return res.status(400).json(response);
        }
    } catch (error) {
        console.error('Database error:', error);
        res.status(500).json({ error: 'Database error'});
    }
}

export const getAllPosts = async (req, res) => {
    try {
        const userId = req.user.uid;
        const response = await getAllPostsInDB(userId);
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