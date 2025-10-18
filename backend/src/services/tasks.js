import { pool } from "../config/db.js";

export const postTaskToDB = async (task, userId) => {
    const connection = await pool.getConnection();
    try {

        await connection.beginTransaction();
        const q1 = "INSERT INTO tasks (user_id, task_name, description, complete_by_date, is_completion_time, priority, repeat_interval, repeat_ends, is_completed) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)";
        const values1 = [userId, task.task_name, task.description, task.complete_by_date, task.is_completion_time, task.priority, task.repeat_interval, task.repeat_ends, task.is_completed];
        const [result1] = await connection.query(q1, values1);

        if (Array.isArray(task.selectedLists) && task.selectedLists.length > 0) {
            const q2 = "INSERT INTO task_list (list_id, task_id) VALUES ?";
            const values2 = task.selectedLists.map(listId => [listId, result1.insertId]);
            await connection.query(q2, [values2]);
        }

        if (Array.isArray(task.reminders) && task.reminders.length > 0) {
            const q3 = "INSERT INTO reminders (reminder_id, task_id) VALUES ?";
            const values3 = task.reminders.map(reminderId => [reminderId, result1.insertId]);
            await connection.query(q3, [values3]);
        }
        
        if (Array.isArray(task.notifications) && task.notifications.length > 0) {
            const q4 = "INSERT INTO notifications (notification_id, task_id) VALUES ?";
            const values4 = task.notifications.map(notificationId => [notificationId, result1.insertId]);
            await connection.query(q4, [values4]);
        }

        await connection.commit();
        return { success: true, message: "Task created successfully." };
    } catch (error) {
        await connection.rollback();
        return { success: false, message: 'Task creation failed.' };
    } finally {
        connection.release();
    }
}