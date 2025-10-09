import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import userRoutes from './routes/users.js';
import { checkConnection } from './config/db.js';
import { createAllTables } from './utils/dbUtils.js';

const app = express();

app.use(cors());
app.use(express.json());

app.use('/users', userRoutes);

app.listen(8800, async () => {
    console.log("Connected to backend!")
    try {
        await checkConnection();
        await createAllTables();
    } catch (error) {
        console.log("Failed to initialize the database", error);
    }
})