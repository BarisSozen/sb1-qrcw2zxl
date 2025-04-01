import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import sequelize from './config/database.js';
import userRoutes from './routes/users.js';
import authRoutes from './routes/auth.js';
import apiKeyRoutes from './routes/apiKeys.js';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/users', userRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/api-keys', apiKeyRoutes);

// Database sync and server start
sequelize.sync().then(() => {
  console.log('Database synced');
  app.listen(port, () => {
    console.log(`Server running on port ${port}`);
  });
}).catch(err => {
  console.error('Failed to sync database:', err);
});