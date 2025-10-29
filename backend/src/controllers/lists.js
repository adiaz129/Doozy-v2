import { postListToDB, getAllListsFromDB, deleteListFromDB, updateListInDB } from '../services/lists.js';

export const postList = async (req, res) => {
    try {
        const list = req.body;
        const userId = req.user.uid;
        const response = await postListToDB(list, userId);
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

export const getAllLists = async (req, res) => {
    try {
        const userId = req.user.uid;
        const response = await getAllListsFromDB(userId);
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

export const deleteList = async (req, res) => {
    try {
        const userId = req.user.uid;
        const listId = req.params.list_id;
        const response = await deleteListFromDB(userId, listId);
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

export const updateList = async (req, res) => {
    try {
        const userId = req.user.uid;
        const listId = req.params.list_id;
        const listName = req.body.list_name;
        const response = await updateListInDB(userId, listId, listName);
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