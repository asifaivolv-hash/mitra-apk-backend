"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireCommunityScope = exports.requireRoles = exports.authenticateToken = exports.normalizeRole = void 0;
const jwt_1 = require("../utils/jwt");
const normalizeRole = (role) => {
    const r = (role || '').toLowerCase();
    if (r === 'superadmin' || r === 'central_admin')
        return 'central_admin';
    if (r === 'admin')
        return 'admin';
    if (r === 'community_manager' || r === 'manager')
        return 'community_manager';
    if (r === 'committee')
        return 'committee';
    return 'member';
};
exports.normalizeRole = normalizeRole;
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;
    if (!token) {
        res.status(401).json({ success: false, message: 'Authentication required. No token provided.' });
        return;
    }
    try {
        const decoded = (0, jwt_1.verifyAccessToken)(token);
        req.user = decoded;
        next();
    }
    catch (err) {
        res.status(401).json({ success: false, message: 'Invalid or expired session token.', error: err.message });
    }
};
exports.authenticateToken = authenticateToken;
const requireRoles = (roles) => {
    return (req, res, next) => {
        if (!req.user) {
            res.status(401).json({ success: false, message: 'Authentication required.' });
            return;
        }
        const userNormalized = (0, exports.normalizeRole)(req.user.role);
        const normalizedRequired = roles.map(r => (0, exports.normalizeRole)(r));
        const isAuthorized = normalizedRequired.includes(userNormalized) ||
            (normalizedRequired.includes('central_admin') && userNormalized === 'central_admin') ||
            (normalizedRequired.includes('admin') && (userNormalized === 'admin' || userNormalized === 'central_admin'));
        if (!isAuthorized) {
            res.status(403).json({
                success: false,
                message: `Forbidden: Access requires one of [${roles.join(', ')}] permissions. Current role: ${req.user.role}`,
            });
            return;
        }
        next();
    };
};
exports.requireRoles = requireRoles;
/**
 * Community Scope Guard
 * Verifies that the manager or admin has rights to the specified community ID
 */
const requireCommunityScope = (req, res, next) => {
    if (!req.user) {
        res.status(401).json({ success: false, message: 'Authentication required.' });
        return;
    }
    const role = (0, exports.normalizeRole)(req.user.role);
    // Central Admin has global access to all communities
    if (role === 'central_admin') {
        return next();
    }
    const targetCommunityId = (req.params.communityId || req.body.communityId || req.query.communityId || req.params.id);
    if (!targetCommunityId) {
        return next();
    }
    // Check if target is user's primary or assigned community
    const primaryMatch = req.user.communityId && req.user.communityId.toString() === targetCommunityId.toString();
    const assignedMatch = req.user.assignedCommunities && req.user.assignedCommunities.some(c => c.toString() === targetCommunityId.toString());
    if (!primaryMatch && !assignedMatch) {
        res.status(403).json({
            success: false,
            message: 'Access Denied: You are not authorized to view or modify records for this community.',
        });
        return;
    }
    next();
};
exports.requireCommunityScope = requireCommunityScope;
