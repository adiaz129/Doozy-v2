import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import userRoutes from './src/routes/users.js';
import taskRoutes from './src/routes/tasks.js';
import authRoutes from './src/routes/auth.js';
import listRoutes from './src/routes/lists.js';
import { verifyToken } from './src/middleware/tokenValidation.js';
import { checkConnection } from './src/config/db.js';
import { createAllTables } from './src/utils/dbUtils.js';

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/tasks', verifyToken, taskRoutes);
app.use('/api/lists', verifyToken, listRoutes);
app.use('/api/users', verifyToken, userRoutes);

app.listen(8800, async () => {
    console.log("Connected to backend!")
    try {
        await checkConnection();
        await createAllTables();
    } catch (error) {
        console.log("Failed to initialize the database", error);
    }
})