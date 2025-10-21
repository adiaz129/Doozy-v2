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
        const q = `SELECT * FROM lists WHERE user_id = (?);`;
        const values = [userId];
        const [result] = await pool.query(q, values);
        
        return { success: true, message: 'Get all lists successful.', data: result };
    } catch (error) {
        console.error(error);
        return { success: false, message: 'Failure to get all lists.'}
    }
}