import { Response } from 'express';
import { CommitteeMember } from '../models/CommitteeMember';
import { AuthenticatedRequest } from '../middleware/auth';
import { logAuditEvent } from '../middleware/audit';

export const getCommitteeMembers = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const members = await CommitteeMember.find({ isActive: true }).sort({ displayOrder: 1, createdAt: 1 });
    res.json({ success: true, data: members });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Failed to fetch committee members.', error: err.message });
  }
};

export const createCommitteeMember = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { role, name, unit, tenure, focus, phoneNumber, email, initials, avatarBg, badgeColor, displayOrder } = req.body;

    if (!role || !name || !unit || !focus) {
      res.status(400).json({ success: false, message: 'Role, name, unit, and focus are required.' });
      return;
    }

    const member = await CommitteeMember.create({
      role,
      name,
      unit,
      tenure: tenure || 'Tenure: 2025 – 2027',
      focus,
      phoneNumber: phoneNumber || '+91 98765 00000',
      email: email || 'committee@greenwoodheights.org',
      initials: initials || name.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase(),
      avatarBg: avatarBg || 'bg-[#060E57]',
      badgeColor: badgeColor || 'bg-blue-100 text-[#060E57]',
      displayOrder: Number(displayOrder) || 0,
      isActive: true,
    });

    await logAuditEvent(req, 'COMMITTEE_CREATE', 'CommitteeMember', member._id.toString(), { name, role });

    res.status(201).json({ success: true, message: 'Committee member added.', data: member });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Failed to create committee member.', error: err.message });
  }
};

export const updateCommitteeMember = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const member = await CommitteeMember.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!member) {
      res.status(404).json({ success: false, message: 'Committee member not found.' });
      return;
    }

    await logAuditEvent(req, 'COMMITTEE_UPDATE', 'CommitteeMember', member._id.toString(), req.body);

    res.json({ success: true, message: 'Committee member updated.', data: member });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Failed to update committee member.', error: err.message });
  }
};

export const deleteCommitteeMember = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const member = await CommitteeMember.findByIdAndDelete(req.params.id);
    if (!member) {
      res.status(404).json({ success: false, message: 'Committee member not found.' });
      return;
    }

    await logAuditEvent(req, 'COMMITTEE_DELETE', 'CommitteeMember', req.params.id, { name: member.name });

    res.json({ success: true, message: 'Committee member removed.' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Failed to delete committee member.', error: err.message });
  }
};
