import { pool } from "../config/db.js";
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export const postRegister = async (user) => {
    console.log(user);

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
            if (keyName === 'users.email_UNIQUE') {
                path = "email";
                msg = "Email is already registered.";
            } else if (keyName === 'users.username_UNIQUE') {
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