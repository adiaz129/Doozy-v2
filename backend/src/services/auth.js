import { pool } from "../config/db.js";
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export const postRegister = async (user) => {
    try {
        const hashedPassword = await bcrypt.hash(user.password, 10);
        const q = "INSERT INTO users (name, email, password, username, username_lower, profile_pic) VALUES (?, ?, ?, ?, ?, ?)";
        const values = [user.name, user.email.toLowerCase(), hashedPassword, user.username, user.username_lower, user.profile_pic];

        const [result] = await pool.query(q, values);

        const token = jwt.sign(
            {uid: result.insertId},
            process.env.JWT_SECRET,
            {expiresIn: '1w'}
        )
        return { success: true, message: "User registered successfully.", token: token };
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            const regex = /Duplicate entry '.*' for key '(.+)'/;
            const match = error.sqlMessage.match(regex);
            const keyName = match ? match[1] : null;

            console.log('Duplicate key error on:', keyName);
            let msg;
            let path;
            if (keyName === 'users.email') {
                path = "email";
                msg = "Email is already registered.";
            } else if (keyName === 'users.username') {
                path = "username";
                msg = "Username is already taken.";
            } else {
                msg = "Duplicate entry error.";
            }
            return { success: false, errors: [{msg: msg, path: path}] };
        }
        return { success: false, message: "Registration Failed" };
    }
}

export const postLogin = async (user) => {
    try {
        const q = "SELECT * FROM users WHERE email = ?"
        const [rows] = await pool.query(q, user.email);
        if (rows.length === 0) {
            return { success: false, errors: [{msg: "Invalid email and/or password."}]};
        }
        const creds = rows[0]
        const passwordMatch = await bcrypt.compare(user.password, creds.password);
        if (!passwordMatch) {
            return { success: false, errors: [{msg: "Invalid email and/or password."}]};
        }
        const token = jwt.sign(
            {uid: creds.user_id},
            process.env.JWT_SECRET,
            {expiresIn: '1w'}
        )
        return { success: true, message: 'Login Successful', token: token }
    } catch (error) {
        return { success: false, errors: [{msg: "Server error. Please try again later."}]};
    }
}