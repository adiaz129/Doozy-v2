import { postRegister } from '../services/auth.js';
import { UserModel } from '../models/userModel.ts';

export const register = async (req, res) => {
    const user = new UserModel({ 
        ...req.body, 
        username_lower: req.body.username.toLowerCase(), 
        profile_pic: "profilepic", // change this
    })
    try {
        const response = await postRegister(user);
        if (response.success) {
            return res.status(200).json(response);
        }
        else {
            return res.status(400).json(response)
        }
    } catch (error) {
        console.error('Database error:', error);
        res.status(500).json({ error: 'Database error' });
    }
}