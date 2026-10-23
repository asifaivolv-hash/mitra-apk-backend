"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const app_1 = __importDefault(require("./app"));
const db_1 = require("./config/db");
const seed_1 = require("./utils/seed");
const PORT = process.env.PORT || 5000;
const startServer = async () => {
    try {
        await (0, db_1.connectDB)();
        await (0, seed_1.seedInitialData)();
        app_1.default.listen(PORT, () => {
            console.log(`====================================================`);
            console.log(` 🚀 Mitra Unified Backend running on port ${PORT}`);
            console.log(` 🏥 Health Check: http://localhost:${PORT}/api/health`);
            console.log(` 📱 Mobile & Web endpoints active`);
            console.log(`====================================================`);
        });
    }
    catch (err) {
        console.error('Fatal: Failed to start server:', err.message);
        process.exit(1);
    }
};
startServer();
