import { pool } from "../config/db.js";

export const postListToDB = async (list, userId) => {
    try {
        const q = "INSERT INTO lists (user_id, list_name) VALUES (?, ?)";
        const values = [userId, list.list_name];
        const [result] = await pool.query(q, values);

        return { success: true, message: "List created successfully.", list_id: result.insertId };
    } catch (error) {
        console.error(error)
        return { success: false, message: 'List creation failed.' };
    }
}

export const getAllListsFromDB = async (userId) => {
    try {
        const q = `SELECT * FROM lists WHERE user_id = (?) ORDER BY time_list_created DESC;`;
        const values = [userId];
        const [result] = await pool.query(q, values);
        
        return { success: true, message: 'Get all lists successful.', body: result };
    } catch (error) {
        console.error(error);
        return { success: false, message: 'Failure to get all lists.'}
    }
}

export const deleteListFromDB = async (userId, listId) => {
    try {
        const q = `DELETE FROM lists WHERE user_id = ? AND list_id = ?;`;
        const values = [userId, listId];
        const [result] = await pool.query(q, values);
        if (result.affectedRows === 0) {
            console.log("No rows deleted — invalid listId/userId or list doesn't exist.");
            return { success: true, message: "List not found or already deleted." };
        }
        return { success: true, message: 'List deletion successful.'};
    } catch (error) {
        console.error(error);
        return {success: false, message: 'Failed to delete list.'};
    }
}

export const updateListInDB = async (userId, listId, listName) => {
    try {
        const q = `UPDATE lists SET list_name = ? WHERE user_id = ? AND list_id = ?;`;
        const values = [listName, userId, listId];
        await pool.query(q, values);
        return { success: true, message: 'List update successfully.'};
    } catch (error) {
        console.error(error);
        return {success: false, message: 'Failed to update list.'};
    }
}