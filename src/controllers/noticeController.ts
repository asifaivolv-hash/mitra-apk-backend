import { Response } from 'express';
import { Notice } from '../models/Notice';
import { Notification } from '../models/Notification';
import { User } from '../models/User';
import { AuthenticatedRequest, normalizeRole } from '../middleware/auth';
import { logAuditEvent } from '../middleware/audit';

export const getNotices = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { category, priority, communityId, status = 'published', search, page = '1', limit = '20' } = req.query;
    const filter: any = {};

    if (category && category !== 'All' && category !== 'all') {
      filter.category = category;
    }
    if (priority && priority !== 'All' && priority !== 'all') {
      filter.priority = priority;
    }
    if (status && status !== 'All' && status !== 'all') {
      filter.status = status;
    }

    const targetCommunity = (communityId as string) || req.user?.communityId;
    if (targetCommunity) {
      filter.$or = [
        { communityId: targetCommunity },
        { targetCommunities: targetCommunity },
        { communityId: { $exists: false } },
        { communityId: null },
      ];
    }

    if (search) {
      filter.$or = [
        { title: { $regex: String(search), $options: 'i' } },
        { content: { $regex: String(search), $options: 'i' } },
      ];
    }

    const pageNum = parseInt(page as string, 10) || 1;
    const limitNum = parseInt(limit as string, 10) || 20;
    const skip = (pageNum - 1) * limitNum;

    const [notices, total] = await Promise.all([
      Notice.find(filter)
        .sort({ isPinned: -1, publishedAt: -1, createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .populate('communityId', 'name code')
        .lean(),
      Notice.countDocuments(filter),
    ]);

    // Attach read status for requesting user
    const userIdStr = req.user?.userId;
    const enriched = notices.map((n) => ({
      ...n,
      isRead: userIdStr ? n.readBy?.some((r: any) => r.toString() === userIdStr) : false,
    }));

    res.json({
      success: true,
      data: enriched,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Failed to fetch announcements.', error: err.message });
  }
};

export const getNoticeById = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const notice = await Notice.findById(req.params.id).populate('communityId', 'name code');
    if (!notice) {
      res.status(404).json({ success: false, message: 'Announcement not found.' });
      return;
    }

    // Auto mark as read for current user
    if (req.user?.userId && !notice.readBy.some((r) => r.toString() === req.user?.userId)) {
      notice.readBy.push(req.user.userId as any);
      await notice.save();
    }

    res.json({ success: true, data: notice });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Failed to fetch announcement details.', error: err.message });
  }
};

export const createNotice = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { title, content, category, priority, author, image, isPinned, communityId, targetCommunities, status } = req.body;

    if (!title || !content) {
      res.status(400).json({ success: false, message: 'Title and content are required.' });
      return;
    }

    const assignedCommunity = communityId || req.user?.communityId;
    const publishImmediately = status !== 'draft';

    const notice = await Notice.create({
      title: title.trim(),
      content: content.trim(),
      category: category || 'Colony Announcement',
      priority: priority || 'normal',
      author: author || req.user?.name || 'Management Committee',
      image: image || '',
      communityId: assignedCommunity,
      targetCommunities: Array.isArray(targetCommunities) ? targetCommunities : assignedCommunity ? [assignedCommunity] : [],
      isPinned: Boolean(isPinned),
      status: publishImmediately ? 'published' : 'draft',
      publishedAt: new Date(),
      createdBy: req.user?.userId,
      readBy: req.user?.userId ? [req.user.userId] : [],
    });

    await logAuditEvent(req, 'NOTICE_CREATE', 'Notice', notice._id.toString(), { title, category });

    // Send notifications to residents if published immediately
    if (publishImmediately && assignedCommunity) {
      const residents = await User.find({
        communityId: assignedCommunity,
        _id: { $ne: req.user?.userId },
        status: 'active',
      }).select('_id');

      const notifs = residents.map((r) => ({
        recipient: r._id,
        type: 'announcement',
        title: `📢 ${notice.title}`,
        body: notice.content.substring(0, 120) + (notice.content.length > 120 ? '...' : ''),
        resourceId: notice._id.toString(),
        resourceType: 'notice',
      }));

      if (notifs.length > 0) {
        Notification.insertMany(notifs).catch(() => {});
      }
    }

    res.status(201).json({
      success: true,
      message: publishImmediately ? 'Announcement published successfully.' : 'Announcement saved as draft.',
      data: notice,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Failed to create announcement.', error: err.message });
  }
};

export const publishNotice = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const notice = await Notice.findByIdAndUpdate(
      id,
      { status: 'published', publishedAt: new Date() },
      { new: true }
    );

    if (!notice) {
      res.status(404).json({ success: false, message: 'Announcement not found.' });
      return;
    }

    // Broadcast push notification
    if (notice.communityId) {
      const residents = await User.find({
        communityId: notice.communityId,
        _id: { $ne: req.user?.userId },
        status: 'active',
      }).select('_id');

      const notifs = residents.map((r) => ({
        recipient: r._id,
        type: 'announcement',
        title: `📢 ${notice.title}`,
        body: notice.content.substring(0, 120),
        resourceId: notice._id.toString(),
        resourceType: 'notice',
      }));

      if (notifs.length > 0) {
        Notification.insertMany(notifs).catch(() => {});
      }
    }

    res.json({ success: true, message: 'Announcement published successfully.', data: notice });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Failed to publish announcement.', error: err.message });
  }
};

export const markNoticeRead = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user?.userId;

    if (userId) {
      await Notice.findByIdAndUpdate(id, {
        $addToSet: { readBy: userId },
      });
    }

    res.json({ success: true, message: 'Marked as read.' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Failed to mark as read.', error: err.message });
  }
};

export const updateNotice = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const notice = await Notice.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!notice) {
      res.status(404).json({ success: false, message: 'Notice not found.' });
      return;
    }

    await logAuditEvent(req, 'NOTICE_UPDATE', 'Notice', notice._id.toString(), req.body);

    res.json({ success: true, message: 'Announcement updated successfully.', data: notice });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Failed to update announcement.', error: err.message });
  }
};

export const deleteNotice = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const notice = await Notice.findByIdAndDelete(req.params.id);
    if (!notice) {
      res.status(404).json({ success: false, message: 'Notice not found.' });
      return;
    }

    await logAuditEvent(req, 'NOTICE_DELETE', 'Notice', req.params.id, { title: notice.title });

    res.json({ success: true, message: 'Announcement removed successfully.' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Failed to delete announcement.', error: err.message });
  }
};
