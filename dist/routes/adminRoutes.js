"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const adminController_1 = require("../controllers/adminController");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
router.use(auth_1.authenticateToken);
// Module 1: Central Admin Entire Data Pictorial Metrics
router.get('/central-metrics', (0, auth_1.requireRoles)(['superadmin', 'central_admin']), adminController_1.getCentralAdminMetrics);
// General metrics & settings
router.get('/metrics', (0, auth_1.requireRoles)(['admin', 'superadmin', 'central_admin', 'community_manager', 'committee']), adminController_1.getMetrics);
router.get('/settings', (0, auth_1.requireRoles)(['admin', 'superadmin', 'central_admin']), adminController_1.getSettings);
router.put('/settings', (0, auth_1.requireRoles)(['admin', 'superadmin', 'central_admin']), adminController_1.updateSettings);
// Administrator Management (Central Admin)
router.post('/admins', (0, auth_1.requireRoles)(['superadmin', 'central_admin']), adminController_1.createAdminUser);
router.patch('/users/:id/role', (0, auth_1.requireRoles)(['superadmin', 'central_admin']), adminController_1.updateUserRole);
// CSV Reports Export (Central Admin / Admin)
router.get('/reports/export', (0, auth_1.requireRoles)(['admin', 'superadmin', 'central_admin']), adminController_1.exportCsvReport);
router.get('/export-csv', (0, auth_1.requireRoles)(['admin', 'superadmin', 'central_admin']), adminController_1.exportCsvReport);
// Module 1 & 2: Community Manager management
router.post('/managers', (0, auth_1.requireRoles)(['admin', 'superadmin', 'central_admin']), adminController_1.createCommunityManager);
router.get('/managers', (0, auth_1.requireRoles)(['admin', 'superadmin', 'central_admin', 'community_manager', 'committee']), adminController_1.getCommunityManagers);
// Module 2: Community Member onboarding by Manager or Admin
router.post('/members', (0, auth_1.requireRoles)(['community_manager', 'manager', 'committee', 'admin', 'superadmin', 'central_admin']), adminController_1.addCommunityMember);
router.get('/users', (0, auth_1.requireRoles)(['community_manager', 'manager', 'committee', 'admin', 'superadmin', 'central_admin']), adminController_1.getUsers);
router.put('/users/:id/status', (0, auth_1.requireRoles)(['admin', 'superadmin', 'central_admin']), adminController_1.updateUserStatus);
router.patch('/users/:id/status', (0, auth_1.requireRoles)(['admin', 'superadmin', 'central_admin']), adminController_1.updateUserStatus);
// Audit logs
router.get('/audit-logs', (0, auth_1.requireRoles)(['admin', 'superadmin', 'central_admin']), adminController_1.getAuditLogs);
exports.default = router;
