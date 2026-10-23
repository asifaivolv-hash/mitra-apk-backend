import { Router } from 'express';
import {
  getAllCommunities,
  getCommunityDetails,
  createCommunity,
  updateCommunity,
  updateCommunityStatus,
  getCommunityMembers,
  joinCommunity,
  updateMemberStatus,
} from '../controllers/communityController';
import { authenticateToken, requireRoles } from '../middleware/auth';

const router = Router();

// Public / Authenticated listing
router.get('/', getAllCommunities);
router.get('/:id', getCommunityDetails);

// Protected routes
router.use(authenticateToken);

// Create community (Admin / Central Admin)
router.post('/', requireRoles(['admin', 'superadmin', 'central_admin']), createCommunity);

// Update details & status
router.put('/:id', requireRoles(['admin', 'superadmin', 'central_admin', 'community_manager']), updateCommunity);
router.patch('/:id', requireRoles(['admin', 'superadmin', 'central_admin', 'community_manager']), updateCommunity);
router.patch('/:id/status', requireRoles(['admin', 'superadmin', 'central_admin']), updateCommunityStatus);

// Members
router.get('/:id/members', getCommunityMembers);
router.post('/:id/join', joinCommunity);
router.patch('/:id/members/:userId', requireRoles(['community_manager', 'manager', 'admin', 'superadmin', 'central_admin']), updateMemberStatus);

export default router;
