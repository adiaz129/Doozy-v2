import { getPostsByUserIdInDB } from "../services/posts.js";


export const getPostsByUserId = async (req, res) => {
    try {
        const userId = req.params.user_id;
        if (req.friendStatus !== "friends" && req.friendStatus !== "currentUser") {
            return res.status(403).json({ error: "Forbidden", friendStatus: req.friendStatus });
        }
        const response = await getPostsByUserIdInDB(userId);
        if (response.success) {
            return res.status(200).json({...response, friendStatus: req.friendStatus});
        }
        else {
            return res.status(400).json({...response, friendStatus: req.friendStatus});
        }
    } catch (error) {
        console.error('Database error:', error);
        res.status(500).json({ error: 'Database error', friendStatus: req.friendStatus });
    }
}