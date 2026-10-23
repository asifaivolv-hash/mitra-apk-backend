import { Response } from 'express';
import { AuthenticatedRequest, normalizeRole } from '../middleware/auth';
import { Notification } from '../models/Notification';
import { DeviceToken } from '../models/DeviceToken';
import { User } from '../models/User';

/**
 * Get user's notifications with unread count
 */
export const getNotifications = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const { page = '1', limit = '30', unreadOnly } = req.query;

    const filter: any = { recipient: userId };
    if (unreadOnly === 'true') {
      filter.read = false;
    }

    const pageNum = parseInt(page as string, 10) || 1;
    const limitNum = parseInt(limit as string, 10) || 30;
    const skip = (pageNum - 1) * limitNum;

    const [total, unreadCount, notifications] = await Promise.all([
      Notification.countDocuments(filter),
      Notification.countDocuments({ recipient: userId, read: false }),
      Notification.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
    ]);

    res.json({
      success: true,
      unreadCount,
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum),
      data: notifications,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to fetch notifications.', error: error.message });
  }
};

/**
 * Mark single notification as read
 */
export const markAsRead = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user?.userId;

    const notification = await Notification.findOneAndUpdate(
      { _id: id, recipient: userId },
      { read: true },
      { new: true }
    );

    if (!notification) {
      res.status(404).json({ success: false, message: 'Notification not found.' });
      return;
    }

    res.json({ success: true, message: 'Marked as read.', data: notification });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to mark notification as read.', error: error.message });
  }
};

/**
 * Mark all notifications as read
 */
export const markAllAsRead = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;

    await Notification.updateMany({ recipient: userId, read: false }, { read: true });

    res.json({ success: true, message: 'All notifications marked as read.' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to mark all as read.', error: error.message });
  }
};

/**
 * Update notification preferences
 */
export const updateNotificationPreferences = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const { announcements, campaigns, events, discussions } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({ success: false, message: 'User not found.' });
      return;
    }

    if (!user.notificationPreferences) {
      user.notificationPreferences = {
        announcements: true,
        campaigns: true,
        events: true,
        discussions: true,
      };
    }

    if (announcements !== undefined) user.notificationPreferences.announcements = announcements;
    if (campaigns !== undefined) user.notificationPreferences.campaigns = campaigns;
    if (events !== undefined) user.notificationPreferences.events = events;
    if (discussions !== undefined) user.notificationPreferences.discussions = discussions;

    await user.save();

    res.json({
      success: true,
      message: 'Notification preferences updated.',
      data: user.notificationPreferences,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to update preferences.', error: error.message });
  }
};

/**
 * Register mobile device push token (Expo Push Token / FCM)
 */
export const registerDeviceToken = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const { token, platform = 'android', deviceModel } = req.body;

    if (!token) {
      res.status(400).json({ success: false, message: 'Device token is required.' });
      return;
    }

    // Upsert device token
    const device = await DeviceToken.findOneAndUpdate(
      { token },
      {
        userId,
        platform,
        deviceModel: deviceModel || '',
        lastActive: new Date(),
      },
      { upsert: true, new: true }
    );

    // Also cache on user document for quick lookups
    await User.findByIdAndUpdate(userId, { fcmToken: token });

    res.json({ success: true, message: 'Device token registered successfully.', data: device });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to register device token.', error: error.message });
  }
};

/**
 * Unregister device token (e.g. on logout)
 */
export const unregisterDeviceToken = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { token } = req.body;
    const userId = req.user?.userId;

    if (token) {
      await DeviceToken.findOneAndDelete({ token, userId });
    } else {
      await DeviceToken.deleteMany({ userId });
    }

    await User.findByIdAndUpdate(userId, { fcmToken: '' });

    res.json({ success: true, message: 'Device token unregistered successfully.' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to unregister device token.', error: error.message });
  }
};

/**
 * Broadcast notification (Admins & Managers)
 */
export const sendBroadcastNotification = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { title, body, type = 'announcement', communityId, targetRole } = req.body;
    const userRole = normalizeRole(req.user?.role || '');

    if (!['central_admin', 'admin', 'community_manager'].includes(userRole)) {
      res.status(403).json({ success: false, message: 'Unauthorized to broadcast notifications.' });
      return;
    }

    if (!title || !body) {
      res.status(400).json({ success: false, message: 'Title and body are required.' });
      return;
    }

    const userFilter: any = { status: 'active' };
    if (communityId) {
      userFilter.communityId = communityId;
    } else if (userRole !== 'central_admin' && req.user?.communityId) {
      userFilter.communityId = req.user.communityId;
    }

    if (targetRole && targetRole !== 'all') {
      userFilter.role = targetRole;
    }

    const targetUsers = await User.find(userFilter).select('_id');
    const notificationDocs = targetUsers.map((u) => ({
      recipient: u._id,
      type,
      title,
      body,
      read: false,
    }));

    if (notificationDocs.length > 0) {
      await Notification.insertMany(notificationDocs);
    }

    res.json({
      success: true,
      message: `Notification broadcast to ${notificationDocs.length} community members.`,
      count: notificationDocs.length,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to broadcast notification.', error: error.message });
  }
};
