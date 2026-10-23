import { Response } from 'express';
import { Helpline } from '../models/Helpline';
import { AuthenticatedRequest } from '../middleware/auth';
import { logAuditEvent } from '../middleware/audit';

export const getHelplines = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const helplines = await Helpline.find({ isActive: true }).sort({ priority: 1, createdAt: 1 });
    res.json({ success: true, data: helplines });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Failed to fetch helplines.', error: err.message });
  }
};

export const createHelpline = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { title, subtitle, extension, phoneNumber, category, tag, priority } = req.body;

    if (!title || !phoneNumber) {
      res.status(400).json({ success: false, message: 'Title and phone number are required.' });
      return;
    }

    const helpline = await Helpline.create({
      title,
      subtitle: subtitle || 'Society Contact',
      extension: extension || '',
      phoneNumber,
      category: category || 'emergency',
      tag: tag || 'Immediate Response',
      priority: Number(priority) || 0,
      isActive: true,
    });

    await logAuditEvent(req, 'HELPLINE_CREATE', 'Helpline', helpline._id.toString(), { title, phoneNumber });

    res.status(201).json({ success: true, message: 'Helpline added successfully.', data: helpline });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Failed to create helpline.', error: err.message });
  }
};

export const updateHelpline = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const helpline = await Helpline.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!helpline) {
      res.status(404).json({ success: false, message: 'Helpline not found.' });
      return;
    }

    await logAuditEvent(req, 'HELPLINE_UPDATE', 'Helpline', helpline._id.toString(), req.body);

    res.json({ success: true, message: 'Helpline updated successfully.', data: helpline });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Failed to update helpline.', error: err.message });
  }
};

export const deleteHelpline = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const helpline = await Helpline.findByIdAndDelete(req.params.id);
    if (!helpline) {
      res.status(404).json({ success: false, message: 'Helpline not found.' });
      return;
    }

    await logAuditEvent(req, 'HELPLINE_DELETE', 'Helpline', req.params.id, { title: helpline.title });

    res.json({ success: true, message: 'Helpline removed.' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Failed to delete helpline.', error: err.message });
  }
};
