"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const mongoose_1 = __importDefault(require("mongoose"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const authRoutes_1 = __importDefault(require("./routes/authRoutes"));
const noticeRoutes_1 = __importDefault(require("./routes/noticeRoutes"));
const eventRoutes_1 = __importDefault(require("./routes/eventRoutes"));
const listingRoutes_1 = __importDefault(require("./routes/listingRoutes"));
const directoryRoutes_1 = __importDefault(require("./routes/directoryRoutes"));
const helplineRoutes_1 = __importDefault(require("./routes/helplineRoutes"));
const discussionRoutes_1 = __importDefault(require("./routes/discussionRoutes"));
const committeeRoutes_1 = __importDefault(require("./routes/committeeRoutes"));
const adminRoutes_1 = __importDefault(require("./routes/adminRoutes"));
const communityRoutes_1 = __importDefault(require("./routes/communityRoutes"));
const complaintRoutes_1 = __importDefault(require("./routes/complaintRoutes"));
const adPosterRoutes_1 = __importDefault(require("./routes/adPosterRoutes"));
const notificationRoutes_1 = __importDefault(require("./routes/notificationRoutes"));
const dashboardRoutes_1 = __importDefault(require("./routes/dashboardRoutes"));
const errorHandler_1 = require("./middleware/errorHandler");
const app = (0, express_1.default)();
// Security middleware
app.use((0, helmet_1.default)({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
}));
// CORS configuration
const allowedOrigins = process.env.CORS_ORIGINS
    ? process.env.CORS_ORIGINS.split(',').map((o) => o.trim())
    : ['http://localhost:5173', 'http://localhost:8081', 'http://localhost:19006'];
app.use((0, cors_1.default)({
    origin: (origin, callback) => {
        // Allow mobile apps, curl, postman (origin === undefined) and localhost
        if (!origin || allowedOrigins.includes(origin) || origin.startsWith('http://localhost:')) {
            callback(null, true);
        }
        else {
            callback(null, true); // Permissive in dev/staging to avoid blocking mobile emulators
        }
    },
    credentials: true,
}));
// Logging & Body parsing
if (process.env.NODE_ENV !== 'test') {
    app.use((0, morgan_1.default)('dev'));
}
app.use(express_1.default.json({ limit: '15mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '15mb' }));
// Rate limiter for authentication endpoints
const authLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: { success: false, message: 'Too many authentication attempts, please try again later.' },
    standardHeaders: true,
    legacyHeaders: false,
});
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/admin-login', authLimiter);
app.use('/api/v1/auth/login', authLimiter);
app.use('/api/v1/auth/admin-login', authLimiter);
// Health check handler
const healthHandler = (req, res) => {
    const dbStatus = mongoose_1.default.connection.readyState;
    const statusMap = {
        0: 'disconnected',
        1: 'connected',
        2: 'connecting',
        3: 'disconnecting',
    };
    res.json({
        status: 'ok',
        service: 'Mitra — Stronger Together Community API',
        version: '1.0.0',
        timestamp: new Date().toISOString(),
        database: {
            status: statusMap[dbStatus] || 'unknown',
            host: mongoose_1.default.connection.host || 'local',
            name: mongoose_1.default.connection.name || 'mitra_db',
        },
        society: 'Greenwood Heights Society',
    });
};
app.get('/api/health', healthHandler);
app.get('/api/v1/health', healthHandler);
// Mount Routes under both /api and /api/v1 for 100% compatibility
const routePrefixes = ['/api', '/api/v1'];
routePrefixes.forEach((prefix) => {
    app.use(`${prefix}/auth`, authRoutes_1.default);
    app.use(`${prefix}/notices`, noticeRoutes_1.default);
    app.use(`${prefix}/announcements`, noticeRoutes_1.default);
    app.use(`${prefix}/events`, eventRoutes_1.default);
    app.use(`${prefix}/classifieds`, listingRoutes_1.default);
    app.use(`${prefix}/directory`, directoryRoutes_1.default);
    app.use(`${prefix}/helplines`, helplineRoutes_1.default);
    app.use(`${prefix}/discussions`, discussionRoutes_1.default);
    app.use(`${prefix}/committee`, committeeRoutes_1.default);
    app.use(`${prefix}/admin`, adminRoutes_1.default);
    app.use(`${prefix}/communities`, communityRoutes_1.default);
    app.use(`${prefix}/complaints`, complaintRoutes_1.default);
    app.use(`${prefix}/reports`, complaintRoutes_1.default);
    app.use(`${prefix}/ads`, adPosterRoutes_1.default);
    app.use(`${prefix}/campaigns`, adPosterRoutes_1.default);
    app.use(`${prefix}/posters`, adPosterRoutes_1.default);
    app.use(`${prefix}/notifications`, notificationRoutes_1.default);
    app.use(`${prefix}/devices`, notificationRoutes_1.default);
    app.use(`${prefix}/dashboard`, dashboardRoutes_1.default);
});
// Centralized Error Handler
app.use(errorHandler_1.errorHandler);
exports.default = app;
