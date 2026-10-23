import { Router } from 'express';
import {
  getNotifications,
  markAsRead,
  markAllAsRead,
  updateNotificationPreferences,
  registerDeviceToken,
  unregisterDeviceToken,
  sendBroadcastNotification,
} from '../controllers/notificationController';
import { authenticateToken, requireRoles } from '../middleware/auth';

const router = Router();

router.use(authenticateToken);

router.get('/', getNotifications);
router.patch('/:id/read', markAsRead);
router.post('/read-all', markAllAsRead);
router.patch('/preferences', updateNotificationPreferences);
router.post('/devices/register', registerDeviceToken);
router.delete('/devices', unregisterDeviceToken);
router.post('/broadcast', requireRoles(['admin', 'superadmin', 'central_admin', 'community_manager']), sendBroadcastNotification);

export default router;
