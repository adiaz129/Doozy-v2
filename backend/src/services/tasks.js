import { pool } from "../config/db.js";
import { parseIdList } from "../utils/helperFunctions.js";

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
        console.log(error);
        await connection.rollback();
        return { success: false, message: 'Task creation failed.' };
    } finally {
        connection.release();
    }
}

export const getAllTasksFromDB = async (userId) => {
    try {
        const q = `SELECT t.task_id, 
            t.task_name, 
            t.description, 
            t.time_task_created, 
            t.complete_by_date, 
            t.is_completion_time, 
            t.priority, 
            t.repeat_interval, 
            t.repeat_ends, 
            t.is_completed, 
            GROUP_CONCAT(DISTINCT l.list_id) AS lists,
            GROUP_CONCAT(DISTINCT r.reminder_id) AS reminders,
            GROUP_CONCAT(DISTINCT n.notification_id) AS notifications
            FROM tasks t
            LEFT JOIN task_list tl ON t.task_id = tl.task_id
            LEFT JOIN lists l ON tl.list_id = l.list_id
            LEFT JOIN reminders r ON t.task_id = r.task_id
            LEFT JOIN notifications n ON t.task_id = n.task_id
            WHERE t.user_id = (?)
            GROUP BY t.task_id;`;
        const values = [userId];
        const [result] = await pool.query(q, values);
        const parsedResult = result.map(task => ({
            ...task,
            is_completed: !!task.is_completed,
            is_completion_time: !!task.is_completion_time,
            lists: parseIdList(task.lists),
            reminders: parseIdList(task.reminders),
            notifications: parseIdList(task.notifications),
        }))

        return {success: true, message: 'Get all tasks request successful', data: parsedResult};
    } catch (error) {
        console.error(error)
        return {success: false, message: 'Failed to get all tasks'};
    }
}

export const getTasksByListIdFromDB = async (listId, userId) => {
    try {
        const q = `SELECT t.task_id, 
            t.task_name, 
            t.description, 
            t.time_task_created, 
            t.complete_by_date, 
            t.is_completion_time, 
            t.priority, 
            t.repeat_interval, 
            t.repeat_ends, 
            t.is_completed, 
            GROUP_CONCAT(DISTINCT l.list_id) AS lists,
            GROUP_CONCAT(DISTINCT r.reminder_id) AS reminders,
            GROUP_CONCAT(DISTINCT n.notification_id) AS notifications
            FROM tasks t
            JOIN task_list tl_filter ON t.task_id = tl_filter.task_id
            JOIN lists l_filter ON tl_filter.list_id = l_filter.list_id AND l_filter.list_id = (?)
            LEFT JOIN task_list tl ON t.task_id = tl.task_id
            LEFT JOIN lists l ON tl.list_id = l.list_id
            LEFT JOIN reminders r ON t.task_id = r.task_id
            LEFT JOIN notifications n ON t.task_id = n.task_id
            WHERE t.user_id = (?)
            GROUP BY t.task_id;`;
        const values = [listId, userId];
        const [result] = await pool.query(q, values);
        const parsedResult = result.map(task => ({
            ...task,
            is_completed: !!task.is_completed,
            is_completion_time: !!task.is_completion_time,
            lists: parseIdList(task.lists),
            reminders: parseIdList(task.reminders),
            notifications: parseIdList(task.notifications),
        }))

        return {success: true, message: 'Get tasks by list id request successful', data: parsedResult};
    } catch (error) {
        return {success: false, message: 'Failed to get tasks by list id'};
    }
}

export const getTaskByIdFromDB = async (taskId, userId) => {
    try {
        const q = `SELECT t.task_id, 
            t.task_name, 
            t.description, 
            t.time_task_created, 
            t.complete_by_date, 
            t.is_completion_time, 
            t.priority, 
            t.repeat_interval, 
            t.repeat_ends, 
            t.is_completed, 
            GROUP_CONCAT(DISTINCT l.list_id) AS lists,
            GROUP_CONCAT(DISTINCT reminder_id) AS reminders,
            GROUP_CONCAT(DISTINCT notification_id) AS notifications
            FROM tasks t
            LEFT JOIN task_list tl ON t.task_id = tl.task_id
            LEFT JOIN lists l ON tl.list_id = l.list_id
            LEFT JOIN reminders r ON t.task_id = r.task_id
            LEFT JOIN notifications n ON t.task_id = n.task_id
            WHERE t.task_id = (?) AND t.user_id = (?)
            GROUP BY t.task_id;`;

        const values = [taskId, userId];
        const [result] = await pool.query(q, values);
        const parsedResult = result.map(task => ({
            ...task,
            is_completed: !!task.is_completed,
            is_completion_time: !!task.is_completion_time,
            lists: parseIdList(task.lists),
            reminders: parseIdList(task.reminders),
            notifications: parseIdList(task.notifications),
        }))

        return {success: true, message: 'Get task by id successful', data: parsedResult};
    } catch (error) {
        return {success: false, message: 'Failed to get task by id'};
    }
}