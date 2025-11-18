import { pool } from '../config/db.js';

const usersQuery = `CREATE TABLE IF NOT EXISTS users (
    user_id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(254) NOT NULL UNIQUE,
    password VARCHAR(128) NOT NULL,
    username VARCHAR(30) NOT NULL UNIQUE,
    username_lower VARCHAR(30) NOT NULL UNIQUE,
    bio VARCHAR(150) DEFAULT NULL,
    profile_pic VARCHAR(255) DEFAULT NULL,
    post_count INT NOT NULL DEFAULT 0,
    task_count INT NOT NULL DEFAULT 0,
    friend_count INT NOT NULL DEFAULT 0
);`;

const tasksQuery = `CREATE TABLE IF NOT EXISTS tasks (
    task_id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    task_name VARCHAR(100) NOT NULL,
    description VARCHAR(255) DEFAULT NULL,
    time_task_created TIMESTAMP NOT NULL DEFAULT (UTC_TIMESTAMP()),
    complete_by_date TIMESTAMP DEFAULT NULL,
    is_completion_time BOOLEAN DEFAULT FALSE,
    priority INT DEFAULT 0,
    repeat_interval INT DEFAULT NULL,
    repeat_ends TIMESTAMP DEFAULT NULL,
    is_completed BOOLEAN DEFAULT FALSE,
    time_task_completed TIMESTAMP DEFAULT NULL,
    posted BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);`;

const listsQuery = `CREATE TABLE IF NOT EXISTS lists (
    list_id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    list_name VARCHAR(100) NOT NULL,
    time_list_created TIMESTAMP NOT NULL DEFAULT (UTC_TIMESTAMP()),
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

const postsQuery = `CREATE TABLE IF NOT EXISTS posts (
    post_id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    post_name VARCHAR(100) NOT NULL,
    description VARCHAR(255) DEFAULT NULL,
    time_posted TIMESTAMP NOT NULL DEFAULT (UTC_TIMESTAMP()),
    image VARCHAR(255) DEFAULT NULL,
    like_count INT NOT NULL DEFAULT 0,
    comment_count INT NOT NULL DEFAULT 0
)`

const friendsQuery = `CREATE TABLE IF NOT EXISTS friends (
    user_id1 int NOT NULL,
    user_id2 int NOT NULL,
    PRIMARY KEY (user_id1, user_id2),
    FOREIGN KEY (user_id1) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (user_id2) REFERENCES users(user_id) ON DELETE CASCADE,
    CONSTRAINT chk_user_order CHECK (user_id1 < user_id2)
);`

const requestsQuery = `CREATE TABLE IF NOT EXISTS requests (
    requesting_id int NOT NULL,
    receiving_id int NOT NULL,
    created_at timestamp NOT NULL DEFAULT (utc_timestamp()),
    PRIMARY KEY (requesting_id, receiving_id),
    FOREIGN KEY (requesting_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (receiving_id) REFERENCES users(user_id) ON DELETE CASCADE
);`

const likesQuery = `CREATE TABLE IF NOT EXISTS likes (
    post_id INT NOT NULL,
    user_id INT NOT NULL,
    time_liked TIMESTAMP NOT NULL DEFAULT (UTC_TIMESTAMP()),
    PRIMARY KEY (post_id, user_id),
    FOREIGN KEY (post_id) REFERENCES posts(post_id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);`

const commentsQuery = `CREATE TABLE IF NOT EXISTS comments (
    comment_id INT PRIMARY KEY AUTO_INCREMENT,
    post_id INT NOT NULL,
    user_id INT NOT NULL,
    comment VARCHAR(250) NOT NULL,
    time_commented TIMESTAMP NOT NULL DEFAULT (UTC_TIMESTAMP()),
    FOREIGN KEY (post_id) REFERENCES posts(post_id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);`


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
        await createTable('posts', postsQuery);
        await createTable('friends', friendsQuery);
        await createTable('requests', requestsQuery);
        await createTable('likes', likesQuery);
        await createTable('comments', commentsQuery);
    } catch (error) {
        console.log("Error creating tables", error);
    }
}

export { createAllTables };