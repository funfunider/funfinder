import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import express from 'express';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config();

import app from './app.js';
import { connectDb } from './db.js';

const PORT = process.env.PORT || 5000;
const buildDir = path.resolve(process.cwd(), 'build');

// Serve static frontend build if it exists
app.use(express.static(buildDir));
app.use((req, res, next) => {
  if (req.path.startsWith('/api') || req.path.startsWith('/uploads')) {
    return next();
  }
  const indexPath = path.join(buildDir, 'index.html');
  if (fs.existsSync(indexPath)) {
    return res.sendFile(indexPath);
  }
  next();
});

async function start() {
  try {
    await connectDb();
    app.listen(PORT, () => {
      console.log(`🚀 Funfinder Admin MongoDB API Server running on port ${PORT}`);
      console.log(`📡 API Endpoints available at: http://localhost:${PORT}/api/`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

start();
