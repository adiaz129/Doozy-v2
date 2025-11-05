import { getUserFromDB } from '../services/users.js';

export const getUser = async (req, res) => {
    try {
        const userId = Number(req.params.user_id);
        const response = await getUserFromDB(userId);
        res.status(200).json(response);
    } catch (error) {
        console.error('Database error:', error);
        res.status(500).json({ error: 'Database error' });
    }
}