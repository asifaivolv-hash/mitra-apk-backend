"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getComplaintMetrics = exports.updateComplaintStatus = exports.getAllComplaints = exports.getMyComplaints = exports.createComplaint = void 0;
const Complaint_1 = require("../models/Complaint");
const User_1 = require("../models/User");
const createComplaint = async (req, res) => {
    try {
        const { title, description, category, priority, images } = req.body;
        if (!title || !description) {
            res.status(400).json({ success: false, message: 'Title and description are required.' });
            return;
        }
        const user = await User_1.User.findById(req.user?.userId);
        if (!user) {
            res.status(404).json({ success: false, message: 'User account not found.' });
            return;
        }
        const complaint = new Complaint_1.Complaint({
            title: title.trim(),
            description: description.trim(),
            category: category || 'Maintenance',
            priority: priority || 'medium',
            communityId: user.communityId,
            userId: user._id,
            userName: user.name,
            userPhone: user.phone,
            unit: {
                block: user.unit.block || 'Block A',
                flat: user.unit.flat || '101',
            },
            images: images || [],
            status: 'pending',
        });
        await complaint.save();
        res.status(201).json({
            success: true,
            message: 'Complaint lodged successfully with community management desk.',
            data: complaint,
        });
    }
    catch (error) {
        res.status(500).json({ success: false, message: 'Failed to lodge complaint.', error: error.message });
    }
};
exports.createComplaint = createComplaint;
const getMyComplaints = async (req, res) => {
    try {
        const complaints = await Complaint_1.Complaint.find({ userId: req.user?.userId })
            .sort({ createdAt: -1 })
            .lean();
        res.json({
            success: true,
            count: complaints.length,
            data: complaints,
        });
    }
    catch (error) {
        res.status(500).json({ success: false, message: 'Failed to retrieve your complaints.', error: error.message });
    }
};
exports.getMyComplaints = getMyComplaints;
const getAllComplaints = async (req, res) => {
    try {
        const { status, category, priority, communityId } = req.query;
        const filter = {};
        // Filter by community if not superadmin or if specified
        if (communityId) {
            filter.communityId = communityId;
        }
        else if (req.user?.role !== 'superadmin' && req.user?.communityId) {
            filter.communityId = req.user.communityId;
        }
        if (status && status !== 'all') {
            filter.status = status;
        }
        if (category && category !== 'all') {
            filter.category = category;
        }
        if (priority && priority !== 'all') {
            filter.priority = priority;
        }
        const complaints = await Complaint_1.Complaint.find(filter)
            .sort({ createdAt: -1 })
            .populate('communityId', 'name code')
            .lean();
        res.json({
            success: true,
            count: complaints.length,
            data: complaints,
        });
    }
    catch (error) {
        res.status(500).json({ success: false, message: 'Failed to retrieve complaints.', error: error.message });
    }
};
exports.getAllComplaints = getAllComplaints;
const updateComplaintStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, assignedTo, resolutionNotes } = req.body;
        const complaint = await Complaint_1.Complaint.findById(id);
        if (!complaint) {
            res.status(404).json({ success: false, message: 'Complaint ticket not found.' });
            return;
        }
        if (status) {
            complaint.status = status;
            if (status === 'resolved') {
                complaint.resolvedAt = new Date();
            }
        }
        if (assignedTo !== undefined) {
            complaint.assignedTo = assignedTo;
        }
        if (resolutionNotes !== undefined) {
            complaint.resolutionNotes = resolutionNotes;
        }
        await complaint.save();
        res.json({
            success: true,
            message: 'Complaint ticket updated successfully.',
            data: complaint,
        });
    }
    catch (error) {
        res.status(500).json({ success: false, message: 'Failed to update complaint.', error: error.message });
    }
};
exports.updateComplaintStatus = updateComplaintStatus;
const getComplaintMetrics = async (req, res) => {
    try {
        const filter = {};
        if (req.user?.role !== 'superadmin' && req.user?.communityId) {
            filter.communityId = req.user.communityId;
        }
        const total = await Complaint_1.Complaint.countDocuments(filter);
        const pending = await Complaint_1.Complaint.countDocuments({ ...filter, status: 'pending' });
        const inProgress = await Complaint_1.Complaint.countDocuments({ ...filter, status: 'in_progress' });
        const resolved = await Complaint_1.Complaint.countDocuments({ ...filter, status: 'resolved' });
        const byCategory = await Complaint_1.Complaint.aggregate([
            { $match: filter },
            { $group: { _id: '$category', count: { $sum: 1 } } },
            { $project: { category: '$_id', count: 1, _id: 0 } },
        ]);
        res.json({
            success: true,
            data: {
                total,
                pending,
                inProgress,
                resolved,
                resolutionRate: total > 0 ? Math.round((resolved / total) * 100) : 100,
                byCategory,
            },
        });
    }
    catch (error) {
        res.status(500).json({ success: false, message: 'Failed to fetch complaint metrics.', error: error.message });
    }
};
exports.getComplaintMetrics = getComplaintMetrics;
