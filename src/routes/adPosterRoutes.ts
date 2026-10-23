import { Router } from 'express';
import {
  getPublicAds,
  recordAdClick,
  getAllAds,
  getAdById,
  createAd,
  updateAd,
  deleteAd,
  submitAdForApproval,
  approveAd,
  rejectAd,
  archiveAd,
  getAdAnalytics,
} from '../controllers/adPosterController';
import { authenticateToken, requireRoles } from '../middleware/auth';

const router = Router();

// Public / Mobile feed routes (authenticated residents & members)
router.get('/public', authenticateToken, getPublicAds);
router.post('/:id/click', authenticateToken, recordAdClick);

// Campaign listing (role-restricted filtering handled in controller)
router.get('/', authenticateToken, getAllAds);
router.get('/:id', authenticateToken, getAdById);
router.get('/:id/analytics', authenticateToken, getAdAnalytics);

// Create campaign (Manager, Admin, Central Admin)
router.post('/', authenticateToken, requireRoles(['community_manager', 'manager', 'committee', 'admin', 'superadmin', 'central_admin']), createAd);

// Submit for approval (Creator / Manager)
router.post('/:id/submit', authenticateToken, submitAdForApproval);

// Approve or Reject (Admin or Central Admin ONLY)
router.post('/:id/approve', authenticateToken, requireRoles(['admin', 'superadmin', 'central_admin']), approveAd);
router.post('/:id/reject', authenticateToken, requireRoles(['admin', 'superadmin', 'central_admin']), rejectAd);

// Archive
router.post('/:id/archive', authenticateToken, requireRoles(['admin', 'superadmin', 'central_admin', 'community_manager']), archiveAd);

// Update & Delete
router.put('/:id', authenticateToken, updateAd);
router.patch('/:id', authenticateToken, updateAd);
router.delete('/:id', authenticateToken, requireRoles(['admin', 'superadmin', 'central_admin', 'community_manager']), deleteAd);

export default router;
