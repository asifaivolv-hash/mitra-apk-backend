"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectDB = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const mongoose_1 = __importDefault(require("mongoose"));
const DEFAULT_MONGODB_URI = 'mongodb+srv://asifaivolv_db_user:Aivolv%402026@cluster0.tzxsajk.mongodb.net/mitra-mobile-apk?retryWrites=true&w=majority';
const connectDB = async () => {
    const uri = process.env.MONGODB_URI || DEFAULT_MONGODB_URI;
    try {
        mongoose_1.default.set('strictQuery', false);
        await mongoose_1.default.connect(uri, {
            serverSelectionTimeoutMS: 8000,
        });
        console.log(`[Database] MongoDB connected successfully to ${mongoose_1.default.connection.host}`);
    }
    catch (err) {
        console.warn(`[Database] Warning: Direct MongoDB connection to ${uri} failed: ${err.message}`);
        console.log(`[Database] Operating in persistent storage mode or fallback.`);
    }
};
exports.connectDB = connectDB;
