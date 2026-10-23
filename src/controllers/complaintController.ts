import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { Complaint } from '../models/Complaint';
import { User } from '../models/User';

export const createComplaint = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { title, description, category, priority, images } = req.body;
    if (!title || !description) {
      res.status(400).json({ success: false, message: 'Title and description are required.' });
      return;
    }

    const user = await User.findById(req.user?.userId);
    if (!user) {
      res.status(404).json({ success: false, message: 'User account not found.' });
      return;
    }

    const complaint = new Complaint({
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
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to lodge complaint.', error: error.message });
  }
};

export const getMyComplaints = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const complaints = await Complaint.find({ userId: req.user?.userId })
      .sort({ createdAt: -1 })
      .lean();

    res.json({
      success: true,
      count: complaints.length,
      data: complaints,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to retrieve your complaints.', error: error.message });
  }
};

export const getAllComplaints = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { status, category, priority, communityId } = req.query;
    const filter: any = {};

    // Filter by community if not superadmin or if specified
    if (communityId) {
      filter.communityId = communityId;
    } else if (req.user?.role !== 'superadmin' && req.user?.communityId) {
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

    const complaints = await Complaint.find(filter)
      .sort({ createdAt: -1 })
      .populate('communityId', 'name code')
      .lean();

    res.json({
      success: true,
      count: complaints.length,
      data: complaints,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to retrieve complaints.', error: error.message });
  }
};

export const updateComplaintStatus = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { status, assignedTo, resolutionNotes } = req.body;

    const complaint = await Complaint.findById(id);
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
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to update complaint.', error: error.message });
  }
};

export const getComplaintMetrics = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const filter: any = {};
    if (req.user?.role !== 'superadmin' && req.user?.communityId) {
      filter.communityId = req.user.communityId;
    }

    const total = await Complaint.countDocuments(filter);
    const pending = await Complaint.countDocuments({ ...filter, status: 'pending' });
    const inProgress = await Complaint.countDocuments({ ...filter, status: 'in_progress' });
    const resolved = await Complaint.countDocuments({ ...filter, status: 'resolved' });

    const byCategory = await Complaint.aggregate([
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
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to fetch complaint metrics.', error: error.message });
  }
};
