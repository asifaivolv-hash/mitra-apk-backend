import dotenv from 'dotenv';
dotenv.config();

import app from './app';
import { connectDB } from './config/db';
import { seedInitialData } from './utils/seed';

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDB();
    await seedInitialData();

    app.listen(PORT, () => {
      console.log(`====================================================`);
      console.log(` 🚀 Mitra Unified Backend running on port ${PORT}`);
      console.log(` 🏥 Health Check: http://localhost:${PORT}/api/health`);
      console.log(` 📱 Mobile & Web endpoints active`);
      console.log(`====================================================`);
    });
  } catch (err: any) {
    console.error('Fatal: Failed to start server:', err.message);
    process.exit(1);
  }
};

startServer();
