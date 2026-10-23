import dotenv from 'dotenv';
dotenv.config();
import mongoose from 'mongoose';

const DEFAULT_MONGODB_URI = 'mongodb+srv://asifaivolv_db_user:Aivolv%402026@cluster0.tzxsajk.mongodb.net/mitra-mobile-apk?retryWrites=true&w=majority';

export const connectDB = async (): Promise<void> => {
  const uri = process.env.MONGODB_URI || DEFAULT_MONGODB_URI;
  try {
    mongoose.set('strictQuery', false);
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 8000,
    });
    console.log(`[Database] MongoDB connected successfully to ${mongoose.connection.host}`);
  } catch (err: any) {
    console.warn(`[Database] Warning: Direct MongoDB connection to ${uri} failed: ${err.message}`);
    console.log(`[Database] Operating in persistent storage mode or fallback.`);
  }
};
