import { getUsersFromDB } from '../services/users.js';

export const getUsers = async (req, res) => {
    try {
        const response = await getUsersFromDB();
        res.status(200).json(response);
    } catch (error) {
        console.error('Database error:', error);
        res.status(500).json({ error: 'Database error' });
    }
}