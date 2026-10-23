"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAdAnalytics = exports.deleteAd = exports.archiveAd = exports.updateAd = exports.rejectAd = exports.approveAd = exports.submitAdForApproval = exports.createAd = exports.getAdById = exports.getAllAds = exports.recordAdClick = exports.getPublicAds = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const auth_1 = require("../middleware/auth");
const AdPoster_1 = require("../models/AdPoster");
const AnalyticsEvent_1 = require("../models/AnalyticsEvent");
const Notification_1 = require("../models/Notification");
const AuditLog_1 = require("../models/AuditLog");
/**
 * Public/Feed Campaigns: Only approved & active/published campaigns
 */
const getPublicAds = async (req, res) => {
    try {
        const { communityId } = req.query;
        const now = new Date();
        const query = {
            status: { $in: ['active', 'published', 'approved'] },
            $and: [
                { $or: [{ startDate: { $lte: now } }, { startDate: { $exists: false } }] },
                { $or: [{ endDate: { $gte: now } }, { endDate: { $exists: false } }] },
            ],
        };
        if (communityId) {
            query.$or = [
                { isGlobal: true },
                { communityId },
                { targetCommunities: communityId },
            ];
        }
        const ads = await AdPoster_1.AdPoster.find(query)
            .sort({ createdAt: -1 })
            .limit(20)
            .populate('communityId', 'name code')
            .lean();
        // Record impressions asynchronously
        if (ads.length > 0) {
            const ids = ads.map((a) => a._id);
            AdPoster_1.AdPoster.updateMany({ _id: { $in: ids } }, { $inc: { impressions: 1 } }).exec();
            if (req.user?.userId) {
                AnalyticsEvent_1.AnalyticsEvent.create({
                    eventType: 'ad_impression',
                    userId: req.user.userId,
                    communityId: req.user.communityId || communityId,
                    resourceId: ids.map(id => id.toString()).join(','),
                    metadata: { count: ads.length },
                }).catch(() => { });
            }
        }
        res.json({
            success: true,
            count: ads.length,
            data: ads,
        });
    }
    catch (error) {
        res.status(500).json({ success: false, message: 'Failed to fetch campaigns and posters.', error: error.message });
    }
};
exports.getPublicAds = getPublicAds;
/**
 * Record click event with analytics
 */
const recordAdClick = async (req, res) => {
    try {
        const { id } = req.params;
        const ad = await AdPoster_1.AdPoster.findByIdAndUpdate(id, { $inc: { clicks: 1 } }, { new: true });
        if (!ad) {
            res.status(404).json({ success: false, message: 'Ad poster not found.' });
            return;
        }
        if (req.user?.userId) {
            AnalyticsEvent_1.AnalyticsEvent.create({
                eventType: 'ad_click',
                userId: req.user.userId,
                communityId: ad.communityId,
                resourceId: id,
                metadata: { targetUrl: ad.targetUrl },
            }).catch(() => { });
        }
        res.json({ success: true, message: 'Click recorded.', clicks: ad.clicks });
    }
    catch (error) {
        res.status(500).json({ success: false, message: 'Failed to record click.', error: error.message });
    }
};
exports.recordAdClick = recordAdClick;
/**
 * Filtered & Role-governed listing of campaigns
 */
const getAllAds = async (req, res) => {
    try {
        const { communityId, category, status, search, page = '1', limit = '50' } = req.query;
        const userRole = (0, auth_1.normalizeRole)(req.user?.role || '');
        const filter = {};
        // Scope restrictions:
        // Central Admin sees everything
        // Admin & Manager see only assigned or created
        if (userRole === 'community_manager' || userRole === 'committee') {
            filter.$or = [
                { createdBy: req.user?.userId },
                { communityId: req.user?.communityId },
                { targetCommunities: req.user?.communityId },
                { isGlobal: true },
            ];
        }
        else if (userRole === 'admin') {
            if (communityId) {
                filter.communityId = communityId;
            }
            else if (req.user?.communityId) {
                filter.$or = [
                    { communityId: req.user.communityId },
                    { targetCommunities: req.user.communityId },
                    { isGlobal: true },
                ];
            }
        }
        else if (communityId) {
            filter.communityId = communityId;
        }
        if (category && category !== 'all') {
            filter.category = category;
        }
        if (status && status !== 'all') {
            filter.status = status;
        }
        if (search) {
            filter.$or = [
                { title: { $regex: String(search), $options: 'i' } },
                { description: { $regex: String(search), $options: 'i' } },
            ];
        }
        const pageNum = parseInt(page, 10) || 1;
        const limitNum = parseInt(limit, 10) || 50;
        const skip = (pageNum - 1) * limitNum;
        const [total, ads] = await Promise.all([
            AdPoster_1.AdPoster.countDocuments(filter),
            AdPoster_1.AdPoster.find(filter)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limitNum)
                .populate('communityId', 'name code')
                .populate('createdBy', 'name email role')
                .populate('approvedBy', 'name email')
                .lean(),
        ]);
        res.json({
            success: true,
            count: ads.length,
            total,
            page: pageNum,
            totalPages: Math.ceil(total / limitNum),
            data: ads,
        });
    }
    catch (error) {
        res.status(500).json({ success: false, message: 'Failed to retrieve campaigns.', error: error.message });
    }
};
exports.getAllAds = getAllAds;
/**
 * Get single campaign by ID
 */
const getAdById = async (req, res) => {
    try {
        const { id } = req.params;
        const ad = await AdPoster_1.AdPoster.findById(id)
            .populate('communityId', 'name code city address')
            .populate('createdBy', 'name email role unit')
            .populate('approvedBy', 'name email');
        if (!ad) {
            res.status(404).json({ success: false, message: 'Campaign poster not found.' });
            return;
        }
        res.json({ success: true, data: ad });
    }
    catch (error) {
        res.status(500).json({ success: false, message: 'Failed to fetch campaign.', error: error.message });
    }
};
exports.getAdById = getAdById;
/**
 * Create campaign (Draft or Submitted)
 */
const createAd = async (req, res) => {
    try {
        const { title, description, badgeText, imageUrl, targetUrl, contactAction, category, communityId, targetCommunities, isGlobal, startDate, endDate, submitImmediately, } = req.body;
        if (!title || !description || !imageUrl) {
            res.status(400).json({ success: false, message: 'Title, description, and poster image URL are required.' });
            return;
        }
        const userRole = (0, auth_1.normalizeRole)(req.user?.role || '');
        const isCentral = userRole === 'central_admin';
        // If submitted immediately, status is pending_approval (or active if created by Central Admin)
        let initialStatus = 'draft';
        if (submitImmediately) {
            initialStatus = isCentral ? 'active' : 'pending_approval';
        }
        const historyEntry = {
            status: initialStatus,
            changedBy: new mongoose_1.default.Types.ObjectId(req.user?.userId),
            note: submitImmediately ? 'Created and submitted for approval.' : 'Saved as draft.',
            timestamp: new Date(),
        };
        const targetList = Array.isArray(targetCommunities)
            ? targetCommunities
            : communityId
                ? [communityId]
                : req.user?.communityId
                    ? [req.user.communityId]
                    : [];
        const ad = new AdPoster_1.AdPoster({
            title: title.trim(),
            description: description.trim(),
            badgeText: badgeText || 'SPONSORED',
            imageUrl: imageUrl.trim(),
            targetUrl: targetUrl ? targetUrl.trim() : '',
            contactAction: contactAction ? contactAction.trim() : '',
            category: category || 'Business Ad',
            communityId: communityId || req.user?.communityId,
            targetCommunities: targetList,
            isGlobal: isCentral ? Boolean(isGlobal) : false,
            startDate: startDate ? new Date(startDate) : new Date(),
            endDate: endDate ? new Date(endDate) : undefined,
            createdBy: req.user?.userId,
            status: initialStatus,
            approvalHistory: [historyEntry],
        });
        await ad.save();
        // Audit Log
        AuditLog_1.AuditLog.create({
            userId: req.user?.userId,
            action: 'CAMPAIGN_CREATE',
            resource: 'AdPoster',
            resourceId: ad._id.toString(),
            details: { title: ad.title, status: ad.status },
            ipAddress: req.ip || '',
        }).catch(() => { });
        res.status(201).json({
            success: true,
            message: submitImmediately
                ? (isCentral ? 'Campaign published successfully.' : 'Campaign submitted for administrator approval.')
                : 'Campaign saved as draft.',
            data: ad,
        });
    }
    catch (error) {
        res.status(500).json({ success: false, message: 'Failed to create campaign.', error: error.message });
    }
};
exports.createAd = createAd;
/**
 * Submit draft or rejected campaign for approval
 */
const submitAdForApproval = async (req, res) => {
    try {
        const { id } = req.params;
        const { note } = req.body;
        const ad = await AdPoster_1.AdPoster.findById(id);
        if (!ad) {
            res.status(404).json({ success: false, message: 'Campaign poster not found.' });
            return;
        }
        const userRole = (0, auth_1.normalizeRole)(req.user?.role || '');
        if (userRole !== 'central_admin' && ad.createdBy?.toString() !== req.user?.userId && userRole !== 'admin') {
            res.status(403).json({ success: false, message: 'You can only submit your own campaigns.' });
            return;
        }
        ad.status = 'pending_approval';
        ad.approvalHistory.push({
            status: 'pending_approval',
            changedBy: new mongoose_1.default.Types.ObjectId(req.user?.userId),
            note: note || 'Submitted for administrative approval.',
            timestamp: new Date(),
        });
        await ad.save();
        res.json({
            success: true,
            message: 'Campaign submitted for approval.',
            data: ad,
        });
    }
    catch (error) {
        res.status(500).json({ success: false, message: 'Failed to submit campaign for approval.', error: error.message });
    }
};
exports.submitAdForApproval = submitAdForApproval;
/**
 * Approve Campaign (Admin or Central Admin ONLY)
 */
const approveAd = async (req, res) => {
    try {
        const { id } = req.params;
        const { note, publishNow = true } = req.body;
        const userRole = (0, auth_1.normalizeRole)(req.user?.role || '');
        if (userRole !== 'admin' && userRole !== 'central_admin') {
            res.status(403).json({ success: false, message: 'Approval requires Administrator or Central Admin role.' });
            return;
        }
        const ad = await AdPoster_1.AdPoster.findById(id);
        if (!ad) {
            res.status(404).json({ success: false, message: 'Campaign poster not found.' });
            return;
        }
        const targetStatus = publishNow ? 'active' : 'approved';
        ad.status = targetStatus;
        ad.approvedBy = new mongoose_1.default.Types.ObjectId(req.user?.userId);
        ad.approvedAt = new Date();
        ad.rejectionReason = '';
        ad.approvalHistory.push({
            status: targetStatus,
            changedBy: new mongoose_1.default.Types.ObjectId(req.user?.userId),
            note: note || 'Approved by administrator.',
            timestamp: new Date(),
        });
        await ad.save();
        // Send notification to creator
        if (ad.createdBy) {
            Notification_1.Notification.create({
                recipient: ad.createdBy,
                type: 'approval',
                title: 'Campaign Approved! 🎉',
                body: `Your campaign "${ad.title}" has been approved and is now active across your community.`,
                resourceId: ad._id.toString(),
                resourceType: 'campaign',
            }).catch(() => { });
        }
        // Audit log
        AuditLog_1.AuditLog.create({
            userId: req.user?.userId,
            action: 'CAMPAIGN_APPROVE',
            resource: 'AdPoster',
            resourceId: ad._id.toString(),
            details: { title: ad.title, approvedStatus: targetStatus },
            ipAddress: req.ip || '',
        }).catch(() => { });
        res.json({
            success: true,
            message: `Campaign approved and ${publishNow ? 'published' : 'marked ready'}.`,
            data: ad,
        });
    }
    catch (error) {
        res.status(500).json({ success: false, message: 'Failed to approve campaign.', error: error.message });
    }
};
exports.approveAd = approveAd;
/**
 * Reject Campaign with Reason (Admin or Central Admin ONLY)
 */
const rejectAd = async (req, res) => {
    try {
        const { id } = req.params;
        const { reason, note } = req.body;
        const userRole = (0, auth_1.normalizeRole)(req.user?.role || '');
        if (userRole !== 'admin' && userRole !== 'central_admin') {
            res.status(403).json({ success: false, message: 'Rejection requires Administrator or Central Admin role.' });
            return;
        }
        if (!reason) {
            res.status(400).json({ success: false, message: 'A rejection reason is required.' });
            return;
        }
        const ad = await AdPoster_1.AdPoster.findById(id);
        if (!ad) {
            res.status(404).json({ success: false, message: 'Campaign poster not found.' });
            return;
        }
        ad.status = 'rejected';
        ad.rejectionReason = reason;
        ad.approvalHistory.push({
            status: 'rejected',
            changedBy: new mongoose_1.default.Types.ObjectId(req.user?.userId),
            note: note || `Rejected: ${reason}`,
            timestamp: new Date(),
        });
        await ad.save();
        // Notify creator with rejection reason so they can revise
        if (ad.createdBy) {
            Notification_1.Notification.create({
                recipient: ad.createdBy,
                type: 'approval',
                title: 'Campaign Revision Required',
                body: `Your campaign "${ad.title}" was not approved: "${reason}". Please edit and resubmit.`,
                resourceId: ad._id.toString(),
                resourceType: 'campaign',
            }).catch(() => { });
        }
        res.json({
            success: true,
            message: 'Campaign rejected with feedback provided to creator.',
            data: ad,
        });
    }
    catch (error) {
        res.status(500).json({ success: false, message: 'Failed to reject campaign.', error: error.message });
    }
};
exports.rejectAd = rejectAd;
/**
 * Update campaign (allowed for creator if draft/rejected or Admin)
 */
const updateAd = async (req, res) => {
    try {
        const { id } = req.params;
        const ad = await AdPoster_1.AdPoster.findById(id);
        if (!ad) {
            res.status(404).json({ success: false, message: 'Campaign poster not found.' });
            return;
        }
        const userRole = (0, auth_1.normalizeRole)(req.user?.role || '');
        const isOwner = ad.createdBy?.toString() === req.user?.userId;
        const isAdmin = userRole === 'admin' || userRole === 'central_admin';
        if (!isOwner && !isAdmin) {
            res.status(403).json({ success: false, message: 'Unauthorized to modify this campaign.' });
            return;
        }
        // If owner modifies a rejected campaign, reset status to draft
        if (isOwner && ad.status === 'rejected') {
            req.body.status = 'draft';
        }
        const updated = await AdPoster_1.AdPoster.findByIdAndUpdate(id, req.body, { new: true });
        res.json({
            success: true,
            message: 'Campaign updated successfully.',
            data: updated,
        });
    }
    catch (error) {
        res.status(500).json({ success: false, message: 'Failed to update campaign.', error: error.message });
    }
};
exports.updateAd = updateAd;
/**
 * Archive campaign
 */
const archiveAd = async (req, res) => {
    try {
        const { id } = req.params;
        const ad = await AdPoster_1.AdPoster.findByIdAndUpdate(id, { status: 'archived' }, { new: true });
        if (!ad) {
            res.status(404).json({ success: false, message: 'Campaign not found.' });
            return;
        }
        res.json({ success: true, message: 'Campaign archived.', data: ad });
    }
    catch (error) {
        res.status(500).json({ success: false, message: 'Failed to archive campaign.', error: error.message });
    }
};
exports.archiveAd = archiveAd;
/**
 * Delete campaign
 */
const deleteAd = async (req, res) => {
    try {
        const { id } = req.params;
        const ad = await AdPoster_1.AdPoster.findByIdAndDelete(id);
        if (!ad) {
            res.status(404).json({ success: false, message: 'Campaign poster not found.' });
            return;
        }
        res.json({ success: true, message: 'Campaign poster deleted successfully.' });
    }
    catch (error) {
        res.status(500).json({ success: false, message: 'Failed to delete campaign.', error: error.message });
    }
};
exports.deleteAd = deleteAd;
/**
 * Campaign analytics summary
 */
const getAdAnalytics = async (req, res) => {
    try {
        const { id } = req.params;
        const ad = await AdPoster_1.AdPoster.findById(id).select('title impressions clicks category status startDate endDate');
        if (!ad) {
            res.status(404).json({ success: false, message: 'Campaign not found.' });
            return;
        }
        const ctr = ad.impressions > 0 ? ((ad.clicks / ad.impressions) * 100).toFixed(2) : '0.00';
        res.json({
            success: true,
            data: {
                campaignId: ad._id,
                title: ad.title,
                status: ad.status,
                impressions: ad.impressions,
                clicks: ad.clicks,
                ctr: `${ctr}%`,
                startDate: ad.startDate,
                endDate: ad.endDate,
            },
        });
    }
    catch (error) {
        res.status(500).json({ success: false, message: 'Failed to fetch campaign analytics.', error: error.message });
    }
};
exports.getAdAnalytics = getAdAnalytics;
