import { Router } from 'express';
import {
  getMetrics,
  getUsers,
  updateUserStatus,
  getAuditLogs,
  getSettings,
  updateSettings,
  createCommunityManager,
  getCommunityManagers,
  addCommunityMember,
  getCentralAdminMetrics,
  createAdminUser,
  updateUserRole,
  exportCsvReport,
} from '../controllers/adminController';
import { authenticateToken, requireRoles } from '../middleware/auth';

const router = Router();

router.use(authenticateToken);

// Module 1: Central Admin Entire Data Pictorial Metrics
router.get('/central-metrics', requireRoles(['superadmin', 'central_admin']), getCentralAdminMetrics);

// General metrics & settings
router.get('/metrics', requireRoles(['admin', 'superadmin', 'central_admin', 'community_manager', 'committee']), getMetrics);
router.get('/settings', requireRoles(['admin', 'superadmin', 'central_admin']), getSettings);
router.put('/settings', requireRoles(['admin', 'superadmin', 'central_admin']), updateSettings);

// Administrator Management (Central Admin)
router.post('/admins', requireRoles(['superadmin', 'central_admin']), createAdminUser);
router.patch('/users/:id/role', requireRoles(['superadmin', 'central_admin']), updateUserRole);

// CSV Reports Export (Central Admin / Admin)
router.get('/reports/export', requireRoles(['admin', 'superadmin', 'central_admin']), exportCsvReport);
router.get('/export-csv', requireRoles(['admin', 'superadmin', 'central_admin']), exportCsvReport);

// Module 1 & 2: Community Manager management
router.post('/managers', requireRoles(['admin', 'superadmin', 'central_admin']), createCommunityManager);
router.get('/managers', requireRoles(['admin', 'superadmin', 'central_admin', 'community_manager', 'committee']), getCommunityManagers);

// Module 2: Community Member onboarding by Manager or Admin
router.post('/members', requireRoles(['community_manager', 'manager', 'committee', 'admin', 'superadmin', 'central_admin']), addCommunityMember);
router.get('/users', requireRoles(['community_manager', 'manager', 'committee', 'admin', 'superadmin', 'central_admin']), getUsers);
router.put('/users/:id/status', requireRoles(['admin', 'superadmin', 'central_admin']), updateUserStatus);
router.patch('/users/:id/status', requireRoles(['admin', 'superadmin', 'central_admin']), updateUserStatus);

// Audit logs
router.get('/audit-logs', requireRoles(['admin', 'superadmin', 'central_admin']), getAuditLogs);

export default router;
