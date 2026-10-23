"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateMemberStatus = exports.joinCommunity = exports.getCommunityMembers = exports.updateCommunityStatus = exports.updateCommunity = exports.createCommunity = exports.getCommunityDetails = exports.getAllCommunities = void 0;
const Community_1 = require("../models/Community");
const User_1 = require("../models/User");
const CommunityMembership_1 = require("../models/CommunityMembership");
const Complaint_1 = require("../models/Complaint");
const Event_1 = require("../models/Event");
const Notice_1 = require("../models/Notice");
const Notification_1 = require("../models/Notification");
const AuditLog_1 = require("../models/AuditLog");
const getAllCommunities = async (req, res) => {
    try {
        const { search, city, status = 'active', page = '1', limit = '50' } = req.query;
        const filter = {};
        if (status && status !== 'all') {
            filter.status = status;
        }
        if (city && city !== 'all') {
            filter.city = { $regex: String(city), $options: 'i' };
        }
        if (search) {
            filter.$or = [
                { name: { $regex: String(search), $options: 'i' } },
                { code: { $regex: String(search), $options: 'i' } },
                { address: { $regex: String(search), $options: 'i' } },
            ];
        }
        const pageNum = parseInt(page, 10) || 1;
        const limitNum = parseInt(limit, 10) || 50;
        const skip = (pageNum - 1) * limitNum;
        const [total, communities] = await Promise.all([
            Community_1.Community.countDocuments(filter),
            Community_1.Community.find(filter)
                .sort({ name: 1 })
                .skip(skip)
                .limit(limitNum)
                .populate('adminId', 'name email phone')
                .populate('assignedManagers', 'name email phone designation')
                .lean(),
        ]);
        // Attach basic member counts
        const communityIds = communities.map(c => c._id);
        const memberCounts = await User_1.User.aggregate([
            { $match: { communityId: { $in: communityIds } } },
            { $group: { _id: '$communityId', count: { $sum: 1 } } },
        ]);
        const countMap = {};
        memberCounts.forEach(m => {
            countMap[m._id.toString()] = m.count;
        });
        const enriched = communities.map(c => ({
            ...c,
            totalMembers: countMap[c._id.toString()] || 0,
        }));
        res.json({
            success: true,
            total,
            count: enriched.length,
            page: pageNum,
            totalPages: Math.ceil(total / limitNum),
            data: enriched,
        });
    }
    catch (error) {
        res.status(500).json({ success: false, message: 'Failed to fetch communities.', error: error.message });
    }
};
exports.getAllCommunities = getAllCommunities;
const getCommunityDetails = async (req, res) => {
    try {
        const { id } = req.params;
        const community = await Community_1.Community.findById(id)
            .populate('adminId', 'name email phone')
            .populate('assignedManagers', 'name email phone designation avatar')
            .lean();
        if (!community) {
            res.status(404).json({ success: false, message: 'Community not found.' });
            return;
        }
        const [memberCount, managerCount, activeComplaints, upcomingEvents, latestNotices] = await Promise.all([
            User_1.User.countDocuments({ communityId: id, role: { $in: ['member', 'resident'] } }),
            User_1.User.countDocuments({ communityId: id, role: { $in: ['community_manager', 'manager', 'committee'] } }),
            Complaint_1.Complaint.countDocuments({ communityId: id, status: { $ne: 'resolved' } }),
            Event_1.Event.countDocuments({ communityId: id }),
            Notice_1.Notice.find({ communityId: id, status: 'published' }).sort({ publishedAt: -1 }).limit(3).lean(),
        ]);
        res.json({
            success: true,
            data: {
                ...community,
                stats: {
                    memberCount,
                    managerCount,
                    activeComplaints,
                    upcomingEvents,
                },
                recentNotices: latestNotices,
            },
        });
    }
    catch (error) {
        res.status(500).json({ success: false, message: 'Failed to fetch community details.', error: error.message });
    }
};
exports.getCommunityDetails = getCommunityDetails;
const createCommunity = async (req, res) => {
    try {
        const { name, code, city, address, totalUnits, adminId, logo, bannerImage, description } = req.body;
        if (!name || !code || !city || !address) {
            res.status(400).json({ success: false, message: 'Name, unique code, city, and address are required.' });
            return;
        }
        const existing = await Community_1.Community.findOne({ code: code.toUpperCase().trim() });
        if (existing) {
            res.status(400).json({ success: false, message: `Community with code "${code.toUpperCase()}" already exists.` });
            return;
        }
        const community = new Community_1.Community({
            name: name.trim(),
            code: code.toUpperCase().trim(),
            city: city.trim(),
            address: address.trim(),
            description: description || 'Active residential community.',
            totalUnits: totalUnits || 100,
            adminId: adminId || req.user?.userId,
            createdBy: req.user?.userId,
            logo: logo || '',
            bannerImage: bannerImage || '',
            status: 'active',
        });
        await community.save();
        // Audit log
        AuditLog_1.AuditLog.create({
            userId: req.user?.userId,
            action: 'COMMUNITY_CREATE',
            resource: 'Community',
            resourceId: community._id.toString(),
            details: { name: community.name, code: community.code },
            ipAddress: req.ip || '',
        }).catch(() => { });
        res.status(201).json({
            success: true,
            message: 'Community registered successfully.',
            data: community,
        });
    }
    catch (error) {
        res.status(500).json({ success: false, message: 'Failed to create community.', error: error.message });
    }
};
exports.createCommunity = createCommunity;
const updateCommunity = async (req, res) => {
    try {
        const { id } = req.params;
        const community = await Community_1.Community.findByIdAndUpdate(id, req.body, { new: true });
        if (!community) {
            res.status(404).json({ success: false, message: 'Community not found.' });
            return;
        }
        res.json({
            success: true,
            message: 'Community updated successfully.',
            data: community,
        });
    }
    catch (error) {
        res.status(500).json({ success: false, message: 'Failed to update community.', error: error.message });
    }
};
exports.updateCommunity = updateCommunity;
const updateCommunityStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        if (!['active', 'inactive', 'pending'].includes(status)) {
            res.status(400).json({ success: false, message: 'Invalid status.' });
            return;
        }
        const community = await Community_1.Community.findByIdAndUpdate(id, { status }, { new: true });
        if (!community) {
            res.status(404).json({ success: false, message: 'Community not found.' });
            return;
        }
        res.json({
            success: true,
            message: `Community status changed to ${status}.`,
            data: community,
        });
    }
    catch (error) {
        res.status(500).json({ success: false, message: 'Failed to update community status.', error: error.message });
    }
};
exports.updateCommunityStatus = updateCommunityStatus;
/**
 * Get members for a specific community
 */
const getCommunityMembers = async (req, res) => {
    try {
        const { id } = req.params;
        const { role, status = 'active', search, page = '1', limit = '50' } = req.query;
        const filter = { communityId: id };
        if (status && status !== 'all') {
            filter.status = status;
        }
        if (role && role !== 'all') {
            filter.role = role;
        }
        if (search) {
            filter.$or = [
                { name: { $regex: String(search), $options: 'i' } },
                { email: { $regex: String(search), $options: 'i' } },
                { phone: { $regex: String(search), $options: 'i' } },
                { 'unit.flat': { $regex: String(search), $options: 'i' } },
            ];
        }
        const pageNum = parseInt(page, 10) || 1;
        const limitNum = parseInt(limit, 10) || 50;
        const skip = (pageNum - 1) * limitNum;
        const [total, members] = await Promise.all([
            User_1.User.countDocuments(filter),
            User_1.User.find(filter)
                .select('-passwordHash')
                .sort({ 'unit.block': 1, 'unit.flat': 1 })
                .skip(skip)
                .limit(limitNum)
                .lean(),
        ]);
        res.json({
            success: true,
            total,
            count: members.length,
            page: pageNum,
            totalPages: Math.ceil(total / limitNum),
            data: members,
        });
    }
    catch (error) {
        res.status(500).json({ success: false, message: 'Failed to fetch members.', error: error.message });
    }
};
exports.getCommunityMembers = getCommunityMembers;
/**
 * Request to join community (Resident/Member)
 */
const joinCommunity = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user?.userId;
        const { block, flat } = req.body;
        if (!flat) {
            res.status(400).json({ success: false, message: 'Flat number is required.' });
            return;
        }
        const community = await Community_1.Community.findById(id);
        if (!community) {
            res.status(404).json({ success: false, message: 'Community not found.' });
            return;
        }
        // Check existing membership
        const existing = await CommunityMembership_1.CommunityMembership.findOne({ userId, communityId: id });
        if (existing) {
            res.status(400).json({
                success: false,
                message: `You already have a ${existing.status} membership request with this community.`,
            });
            return;
        }
        const membership = new CommunityMembership_1.CommunityMembership({
            userId,
            communityId: id,
            status: 'pending',
            role: 'member',
            unit: {
                block: block || 'Block A',
                flat: flat.trim(),
            },
            requestedAt: new Date(),
        });
        await membership.save();
        // Notify community managers
        const managers = await User_1.User.find({
            communityId: id,
            role: { $in: ['community_manager', 'manager', 'committee', 'admin'] },
        }).select('_id');
        const alerts = managers.map((m) => ({
            recipient: m._id,
            type: 'membership',
            title: 'New Membership Request',
            body: `${req.user?.name} has requested to join flat ${flat} (${block || 'Block A'}).`,
            resourceId: membership._id.toString(),
            resourceType: 'membership',
        }));
        if (alerts.length > 0) {
            Notification_1.Notification.insertMany(alerts).catch(() => { });
        }
        res.status(201).json({
            success: true,
            message: 'Membership request submitted. Awaiting manager approval.',
            data: membership,
        });
    }
    catch (error) {
        res.status(500).json({ success: false, message: 'Failed to request membership.', error: error.message });
    }
};
exports.joinCommunity = joinCommunity;
/**
 * Approve or Reject membership (Manager / Admin)
 */
const updateMemberStatus = async (req, res) => {
    try {
        const { id, userId } = req.params;
        const { status, role } = req.body;
        if (!['active', 'rejected', 'suspended'].includes(status)) {
            res.status(400).json({ success: false, message: 'Valid status is active, rejected, or suspended.' });
            return;
        }
        const membership = await CommunityMembership_1.CommunityMembership.findOneAndUpdate({ userId, communityId: id }, {
            status,
            approvedBy: req.user?.userId,
            approvedAt: new Date(),
            ...(role ? { role } : {}),
        }, { new: true });
        if (status === 'active') {
            await User_1.User.findByIdAndUpdate(userId, {
                communityId: id,
                status: 'active',
                ...(role ? { role } : {}),
            });
            Notification_1.Notification.create({
                recipient: userId,
                type: 'membership',
                title: 'Community Membership Approved! 🏡',
                body: 'Welcome to your community! You now have full verified resident access.',
                resourceId: id,
                resourceType: 'community',
            }).catch(() => { });
        }
        res.json({
            success: true,
            message: `Membership status updated to ${status}.`,
            data: membership,
        });
    }
    catch (error) {
        res.status(500).json({ success: false, message: 'Failed to update member status.', error: error.message });
    }
};
exports.updateMemberStatus = updateMemberStatus;
