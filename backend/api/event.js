import express from 'express';
import cors from 'cors';
import fileUpload from 'express-fileupload';
import dotenv from 'dotenv';
import eventRoutes from '../routes/events.js';
import { createServer } from '@vercel/node';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());
app.use(fileUpload({ limits: { fileSize: 5 * 1024 * 1024 }, createParentPath: true }));

app.use('/api/events', eventRoutes);

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something broke!' });
});

export default createServer(app);
