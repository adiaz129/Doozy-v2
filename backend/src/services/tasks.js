import { pool } from "../config/db.js";
import { parseIdList, parseStringIdList } from "../utils/helperFunctions.js";

export const postTaskToDB = async (task, userId) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        const q1 = "INSERT INTO tasks (user_id, task_name, description, complete_by_date, is_completion_time, priority, repeat_interval, repeat_ends, is_completed) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)";
        const values1 = [userId, task.task_name, task.description, task.complete_by_date, task.is_completion_time, task.priority, task.repeat_interval, task.repeat_ends, task.is_completed];
        const [result1] = await connection.query(q1, values1);

        if (Array.isArray(task.lists) && task.lists.length > 0) {
            const q2 = "INSERT INTO task_list (list_id, task_id) VALUES ?";
            const values2 = task.lists.map(listId => [listId, result1.insertId]);
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
            t.posted,
            GROUP_CONCAT(DISTINCT tl.list_id) AS lists,
            GROUP_CONCAT(DISTINCT r.reminder_id) AS reminders,
            GROUP_CONCAT(DISTINCT n.notification_id) AS notifications
            FROM tasks t
            LEFT JOIN task_list tl ON t.task_id = tl.task_id
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
            posted: !!task.posted,
            lists: parseIdList(task.lists),
            reminders: parseIdList(task.reminders),
            notifications: parseStringIdList(task.notifications),
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
            t.posted,
            GROUP_CONCAT(DISTINCT tl.list_id) AS lists,
            GROUP_CONCAT(DISTINCT r.reminder_id) AS reminders,
            GROUP_CONCAT(DISTINCT n.notification_id) AS notifications
            FROM tasks t
            JOIN task_list tl_filter ON t.task_id = tl_filter.task_id
            JOIN lists l_filter ON tl_filter.list_id = l_filter.list_id AND l_filter.list_id = (?)
            LEFT JOIN task_list tl ON t.task_id = tl.task_id
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
            posted: !!task.posted,
            lists: parseIdList(task.lists),
            reminders: parseIdList(task.reminders),
            notifications: parseStringIdList(task.notifications),
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
            t.posted,
            GROUP_CONCAT(DISTINCT tl.list_id) AS lists,
            GROUP_CONCAT(DISTINCT reminder_id) AS reminders,
            GROUP_CONCAT(DISTINCT notification_id) AS notifications
            FROM tasks t
            LEFT JOIN task_list tl ON t.task_id = tl.task_id
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
            posted: !!task.posted,
            lists: parseIdList(task.lists),
            reminders: parseIdList(task.reminders),
            notifications: parseStringIdList(task.notifications),
        }))

        return {success: true, message: 'Get task by id successful', data: parsedResult};
    } catch (error) {
        return {success: false, message: 'Failed to get task by id'};
    }
}

export const completeTaskInDB = async (taskId, userId, task) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        const q1 = `UPDATE tasks SET is_completed = ?, time_task_completed = UTC_TIMESTAMP(), posted = ? WHERE task_id = ? AND user_id = ?;`;
        const values1 = [true, task.post, taskId, userId];
        await connection.query(q1, values1);
        await connection.query(`DELETE FROM notifications WHERE task_id = ?`, [taskId]);

        if (task.post) {
            const q2 = `INSERT INTO posts (user_id, post_name, description, image) VALUES (?, ?, ?, ?);`;
            const values2 = [userId, task.task_name, task.description, task.image];
            await connection.query(q2, values2);
        }

        if (task.new_complete_by_date) {
            const q3 = `SELECT t.task_id, 
                t.task_name, 
                t.description, 
                t.time_task_created,
                t.is_completion_time, 
                t.priority, 
                t.repeat_interval, 
                t.repeat_ends, 
                t.is_completed, 
                GROUP_CONCAT(DISTINCT tl.list_id) AS lists,
                GROUP_CONCAT(DISTINCT reminder_id) AS reminders
                FROM tasks t
                LEFT JOIN task_list tl ON t.task_id = tl.task_id
                LEFT JOIN reminders r ON t.task_id = r.task_id
                WHERE t.task_id = (?) AND t.user_id = (?)
                GROUP BY t.task_id;`;
            const values3 = [taskId, userId];
            const [result3] = await connection.query(q3, values3);
            const originalTaskRow = result3[0];

            const originalTask = {
                ...originalTaskRow,
                is_completed: !!originalTaskRow.is_completed,
                is_completion_time: !!originalTaskRow.is_completion_time,
                lists: parseIdList(originalTaskRow.lists),
                reminders: parseIdList(originalTaskRow.reminders),
            };

            const q4 = "INSERT INTO tasks (user_id, task_name, description, complete_by_date, is_completion_time, priority, repeat_interval, repeat_ends, is_completed) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)";
            const values4 = [userId, task.task_name, task.description, task.new_complete_by_date, originalTask.is_completion_time, originalTask.priority, originalTask.repeat_interval, originalTask.repeat_ends, false];
            const [newTask] = await connection.query(q4, values4);

            if (Array.isArray(originalTask.lists) && originalTask.lists.length > 0) {
                const q5 = "INSERT INTO task_list (list_id, task_id) VALUES ?";
                const values5 = originalTask.lists.map(listId => [listId, newTask.insertId]);
                await connection.query(q5, [values5]);
            }

            if (Array.isArray(originalTask.reminders) && originalTask.reminders.length > 0) {
                const q6 = "INSERT INTO reminders (reminder_id, task_id) VALUES ?";
                const values6 = originalTask.reminders.map(reminderId => [reminderId, newTask.insertId]);
                await connection.query(q6, [values6]);
            }

            if (Array.isArray(task.new_notifications) && task.new_notifications.length > 0) {
                const q7 = "INSERT INTO notifications (notification_id, task_id) VALUES ?";
                const values7 = task.new_notifications.map(notificationId => [notificationId, newTask.insertId]);
                await connection.query(q7, [values7]);
            }
        }
        await connection.commit();
        return { success: true, message: "Task completed successfully." };
    } catch (error) {
        console.log(error);
        await connection.rollback();
        return { success: false, message: 'Task completion failed.' };
    } finally {
        connection.release();
    }
}