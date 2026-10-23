"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logAuditEvent = void 0;
const AuditLog_1 = require("../models/AuditLog");
const logAuditEvent = async (req, action, resource, resourceId, details) => {
    try {
        if (!req.user)
            return;
        const ipAddress = (req?.headers ? req.headers['x-forwarded-for'] : '') || req?.socket?.remoteAddress || '';
        await AuditLog_1.AuditLog.create({
            adminId: req.user.userId,
            adminName: req.user.name,
            adminEmail: req.user.email,
            action,
            resource,
            resourceId: resourceId || '',
            details: details || {},
            ipAddress,
        });
    }
    catch (err) {
        console.error('[AuditLog] Failed to log administrative event:', err.message);
    }
};
exports.logAuditEvent = logAuditEvent;
