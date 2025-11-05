import { postTaskToDB, getAllTasksFromDB, getTasksByListIdFromDB, getTaskByIdFromDB, updateTaskInDB, deleteTaskInDB } from '../services/tasks.js';

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

export const getTasks = async (req, res) => {
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

export const updateTask = async (req, res) => {
    try {
        const taskId = Number(req.params.task_id);
        const userId = req.user.uid;
        const task = req.body;

        const response = await updateTaskInDB(taskId, userId, task);
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

export const deleteTask = async (req, res) => {
    try {
        const taskId = Number(req.params.task_id);
        const userId = req.user.uid;

        const response = await deleteTaskInDB(taskId, userId);
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