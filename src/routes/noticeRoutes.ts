import { Router } from 'express';
import {
  getNotices,
  getNoticeById,
  createNotice,
  updateNotice,
  deleteNotice,
  publishNotice,
  markNoticeRead,
} from '../controllers/noticeController';
import { authenticateToken, requireRoles } from '../middleware/auth';

const router = Router();

router.use(authenticateToken);

router.get('/', getNotices);
router.get('/:id', getNoticeById);
router.post('/:id/read', markNoticeRead);

// Protected actions for Committee, Managers, Admins
router.post('/', requireRoles(['committee', 'community_manager', 'manager', 'admin', 'superadmin', 'central_admin']), createNotice);
router.post('/:id/publish', requireRoles(['committee', 'community_manager', 'manager', 'admin', 'superadmin', 'central_admin']), publishNotice);
router.put('/:id', requireRoles(['committee', 'community_manager', 'manager', 'admin', 'superadmin', 'central_admin']), updateNotice);
router.patch('/:id', requireRoles(['committee', 'community_manager', 'manager', 'admin', 'superadmin', 'central_admin']), updateNotice);
router.delete('/:id', requireRoles(['admin', 'superadmin', 'central_admin']), deleteNotice);

export default router;
