"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendBroadcastNotification = exports.unregisterDeviceToken = exports.registerDeviceToken = exports.updateNotificationPreferences = exports.markAllAsRead = exports.markAsRead = exports.getNotifications = void 0;
const auth_1 = require("../middleware/auth");
const Notification_1 = require("../models/Notification");
const DeviceToken_1 = require("../models/DeviceToken");
const User_1 = require("../models/User");
/**
 * Get user's notifications with unread count
 */
const getNotifications = async (req, res) => {
    try {
        const userId = req.user?.userId;
        const { page = '1', limit = '30', unreadOnly } = req.query;
        const filter = { recipient: userId };
        if (unreadOnly === 'true') {
            filter.read = false;
        }
        const pageNum = parseInt(page, 10) || 1;
        const limitNum = parseInt(limit, 10) || 30;
        const skip = (pageNum - 1) * limitNum;
        const [total, unreadCount, notifications] = await Promise.all([
            Notification_1.Notification.countDocuments(filter),
            Notification_1.Notification.countDocuments({ recipient: userId, read: false }),
            Notification_1.Notification.find(filter)
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
    }
    catch (error) {
        res.status(500).json({ success: false, message: 'Failed to fetch notifications.', error: error.message });
    }
};
exports.getNotifications = getNotifications;
/**
 * Mark single notification as read
 */
const markAsRead = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user?.userId;
        const notification = await Notification_1.Notification.findOneAndUpdate({ _id: id, recipient: userId }, { read: true }, { new: true });
        if (!notification) {
            res.status(404).json({ success: false, message: 'Notification not found.' });
            return;
        }
        res.json({ success: true, message: 'Marked as read.', data: notification });
    }
    catch (error) {
        res.status(500).json({ success: false, message: 'Failed to mark notification as read.', error: error.message });
    }
};
exports.markAsRead = markAsRead;
/**
 * Mark all notifications as read
 */
const markAllAsRead = async (req, res) => {
    try {
        const userId = req.user?.userId;
        await Notification_1.Notification.updateMany({ recipient: userId, read: false }, { read: true });
        res.json({ success: true, message: 'All notifications marked as read.' });
    }
    catch (error) {
        res.status(500).json({ success: false, message: 'Failed to mark all as read.', error: error.message });
    }
};
exports.markAllAsRead = markAllAsRead;
/**
 * Update notification preferences
 */
const updateNotificationPreferences = async (req, res) => {
    try {
        const userId = req.user?.userId;
        const { announcements, campaigns, events, discussions } = req.body;
        const user = await User_1.User.findById(userId);
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
        if (announcements !== undefined)
            user.notificationPreferences.announcements = announcements;
        if (campaigns !== undefined)
            user.notificationPreferences.campaigns = campaigns;
        if (events !== undefined)
            user.notificationPreferences.events = events;
        if (discussions !== undefined)
            user.notificationPreferences.discussions = discussions;
        await user.save();
        res.json({
            success: true,
            message: 'Notification preferences updated.',
            data: user.notificationPreferences,
        });
    }
    catch (error) {
        res.status(500).json({ success: false, message: 'Failed to update preferences.', error: error.message });
    }
};
exports.updateNotificationPreferences = updateNotificationPreferences;
/**
 * Register mobile device push token (Expo Push Token / FCM)
 */
const registerDeviceToken = async (req, res) => {
    try {
        const userId = req.user?.userId;
        const { token, platform = 'android', deviceModel } = req.body;
        if (!token) {
            res.status(400).json({ success: false, message: 'Device token is required.' });
            return;
        }
        // Upsert device token
        const device = await DeviceToken_1.DeviceToken.findOneAndUpdate({ token }, {
            userId,
            platform,
            deviceModel: deviceModel || '',
            lastActive: new Date(),
        }, { upsert: true, new: true });
        // Also cache on user document for quick lookups
        await User_1.User.findByIdAndUpdate(userId, { fcmToken: token });
        res.json({ success: true, message: 'Device token registered successfully.', data: device });
    }
    catch (error) {
        res.status(500).json({ success: false, message: 'Failed to register device token.', error: error.message });
    }
};
exports.registerDeviceToken = registerDeviceToken;
/**
 * Unregister device token (e.g. on logout)
 */
const unregisterDeviceToken = async (req, res) => {
    try {
        const { token } = req.body;
        const userId = req.user?.userId;
        if (token) {
            await DeviceToken_1.DeviceToken.findOneAndDelete({ token, userId });
        }
        else {
            await DeviceToken_1.DeviceToken.deleteMany({ userId });
        }
        await User_1.User.findByIdAndUpdate(userId, { fcmToken: '' });
        res.json({ success: true, message: 'Device token unregistered successfully.' });
    }
    catch (error) {
        res.status(500).json({ success: false, message: 'Failed to unregister device token.', error: error.message });
    }
};
exports.unregisterDeviceToken = unregisterDeviceToken;
/**
 * Broadcast notification (Admins & Managers)
 */
const sendBroadcastNotification = async (req, res) => {
    try {
        const { title, body, type = 'announcement', communityId, targetRole } = req.body;
        const userRole = (0, auth_1.normalizeRole)(req.user?.role || '');
        if (!['central_admin', 'admin', 'community_manager'].includes(userRole)) {
            res.status(403).json({ success: false, message: 'Unauthorized to broadcast notifications.' });
            return;
        }
        if (!title || !body) {
            res.status(400).json({ success: false, message: 'Title and body are required.' });
            return;
        }
        const userFilter = { status: 'active' };
        if (communityId) {
            userFilter.communityId = communityId;
        }
        else if (userRole !== 'central_admin' && req.user?.communityId) {
            userFilter.communityId = req.user.communityId;
        }
        if (targetRole && targetRole !== 'all') {
            userFilter.role = targetRole;
        }
        const targetUsers = await User_1.User.find(userFilter).select('_id');
        const notificationDocs = targetUsers.map((u) => ({
            recipient: u._id,
            type,
            title,
            body,
            read: false,
        }));
        if (notificationDocs.length > 0) {
            await Notification_1.Notification.insertMany(notificationDocs);
        }
        res.json({
            success: true,
            message: `Notification broadcast to ${notificationDocs.length} community members.`,
            count: notificationDocs.length,
        });
    }
    catch (error) {
        res.status(500).json({ success: false, message: 'Failed to broadcast notification.', error: error.message });
    }
};
exports.sendBroadcastNotification = sendBroadcastNotification;
