import { pool } from '../config/db.js';

const usersQuery = `CREATE TABLE IF NOT EXISTS users (
  user_id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(254) NOT NULL UNIQUE,
  password VARCHAR(128) NOT NULL,
  username VARCHAR(30) NOT NULL UNIQUE,
  username_lower VARCHAR(30) NOT NULL UNIQUE,
  bio VARCHAR(150) DEFAULT NULL,
  profile_pic VARCHAR(255),
  post_count INT NOT NULL DEFAULT 0,
  task_count INT NOT NULL DEFAULT 0,
  friend_count INT NOT NULL DEFAULT 0
);`;

const tasksQuery = `CREATE TABLE IF NOT EXISTS tasks (
    task_id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    task_name VARCHAR(100) NOT NULL,
    description VARCHAR(255) DEFAULT NULL,
    time_task_created DATETIME NOT NULL DEFAULT (UTC_TIMESTAMP()),
    complete_by_date DATETIME DEFAULT NULL,
    is_completion_time BOOLEAN DEFAULT FALSE,
    priority INT DEFAULT 0,
    repeat_interval INT DEFAULT NULL,
    repeat_ends DATETIME DEFAULT NULL,
    is_completed BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);`;

const listsQuery = `CREATE TABLE IF NOT EXISTS lists (
    list_id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    list_name VARCHAR(100) NOT NULL,
    time_list_created DATETIME NOT NULL DEFAULT (UTC_TIMESTAMP()),
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);`;

const task_listQuery = `CREATE TABLE IF NOT EXISTS task_list (
    task_id INT,
    list_id INT,
    PRIMARY KEY (task_id, list_id),
    FOREIGN KEY (task_id) REFERENCES tasks(task_id) ON DELETE CASCADE,
    FOREIGN KEY (list_id) REFERENCES lists(list_id) ON DELETE CASCADE
);`;

const remindersQuery = `CREATE TABLE IF NOT EXISTS reminders (
    reminder_id INT,
    task_id INT,
    PRIMARY KEY (reminder_id, task_id),
    FOREIGN KEY (task_id) REFERENCES tasks(task_id) ON DELETE CASCADE
);`;

const notificationsQuery = `CREATE TABLE IF NOT EXISTS notifications (
    notification_id VARCHAR(50) NOT NULL,
    task_id INT NOT NULL,
    PRIMARY KEY (notification_id, task_id),
    FOREIGN KEY (task_id) REFERENCES tasks(task_id) ON DELETE CASCADE
);`;



//make 

const createTable = async (tableName, query) => {
    try {
        await pool.query(query);
        console.log(`${tableName} created or already exists`);
    } catch (error) {
        console.log(`Error creating ${tableName}`, error);
    }
}

const createAllTables = async () => {
    try {
        await createTable('users', usersQuery);
        await createTable('tasks', tasksQuery);
        await createTable('lists', listsQuery);
        await createTable('task_list', task_listQuery);
        await createTable('reminders', remindersQuery);
        await createTable('notifications', notificationsQuery);
    } catch (error) {
        console.log("Error creating tables", error);
    }
}

export { createAllTables };