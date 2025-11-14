import { getUserFromDB, getUsersFromSearchFromDB } from '../services/users.js';

export const getUser = async (req, res) => {
    try {
        const userId = Number(req.params.user_id);
        const response = await getUserFromDB(userId);
        res.status(200).json({...response, friendStatus: req.friendStatus });
    } catch (error) {
        console.error('Database error:', error);
        res.status(500).json({ error: 'Database error', friendStatus: req.friendStatus  });
    }
}

export const getUsersFromSearch = async (req, res) => {
    try {
        const userId = req.user.uid;
        const searchQuery = req.query.q;
        const response = await getUsersFromSearchFromDB(userId, searchQuery);
        if (response.success) {
            return res.status(200).json(response);
        }
        else {
            return res.status(400).json(response);
        }
    } catch (error) {
        console.error('Database error:', error);
        res.status(500).json({ error: 'Database error' });
    }
}