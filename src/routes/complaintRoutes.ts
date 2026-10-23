import { Router } from 'express';
import {
  createComplaint,
  getMyComplaints,
  getAllComplaints,
  updateComplaintStatus,
  getComplaintMetrics,
} from '../controllers/complaintController';
import { authenticateToken, requireRoles } from '../middleware/auth';

const router = Router();

router.use(authenticateToken);

// Resident routes
router.post('/', createComplaint);
router.get('/my', getMyComplaints);

// Manager and Admin routes
router.get('/', requireRoles(['community_manager', 'committee', 'admin', 'superadmin']), getAllComplaints);
router.get('/metrics', requireRoles(['community_manager', 'committee', 'admin', 'superadmin']), getComplaintMetrics);
router.put('/:id/status', requireRoles(['community_manager', 'committee', 'admin', 'superadmin']), updateComplaintStatus);

export default router;
