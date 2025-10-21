import { postTaskToDB, getAllTasksFromDB, getTasksByListIdFromDB, getTaskByIdFromDB, } from '../services/tasks.js';

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

export const getAllTasks = async (req, res) => {
    try {
        const userId = req.user.uid;
        const response = await getAllTasksFromDB(userId);
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

export const getTaskById = async (req, res) => {
    try {
        const taskId = req.params.task_id;
        const userId = req.user.uid;
        const response = await getTaskByIdFromDB(taskId, userId);
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

export const getTasksByListId = async (req, res) => {
    try {
        const taskId = req.params.list_id;
        const userId = req.user.uid;
        const response = await getTasksByListIdFromDB(taskId, userId);
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