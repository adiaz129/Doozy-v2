import { postTaskToDB } from '../services/tasks.js';

export const postTask = async (req, res) => {
    try {
        const task = req.body;
        const userId = req.user.uid;
        const response = await postTaskToDB(task, userId);
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