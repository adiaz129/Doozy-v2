import { pool } from '../config/db.js';

const usersQuery = `CREATE TABLE IF NOT EXISTS users (
  user_id INT NOT NULL AUTO_INCREMENT,
  email VARCHAR(254) NOT NULL,
  password VARCHAR(60) NOT NULL,
  username VARCHAR(30) NOT NULL,
  username_lower VARCHAR(30) NOT NULL,
  bio VARCHAR(150) DEFAULT NULL,
  profile_pic VARCHAR(255) NOT NULL,
  post_count INT NOT NULL DEFAULT 0,
  task_count INT NOT NULL DEFAULT 0,
  friend_count INT NOT NULL DEFAULT 0,
  PRIMARY KEY (user_id),
  UNIQUE KEY email_UNIQUE (email),
  UNIQUE KEY username_UNIQUE (username),
  UNIQUE KEY username_lower_UNIQUE (username_lower)
);`;

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
    } catch (error) {
        console.log("Error creating tables", error);
    }
}

export { createAllTables };