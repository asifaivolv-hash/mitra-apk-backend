import { Response } from 'express';
import mongoose from 'mongoose';
import { Event } from '../models/Event';
import { AuthenticatedRequest } from '../middleware/auth';
import { logAuditEvent } from '../middleware/audit';

export const getEvents = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { category } = req.query;
    const filter: any = {};

    if (category && category !== 'All') {
      filter.category = category;
    }

    const events = await Event.find(filter)
      .populate('rsvps', 'name unit')
      .sort({ createdAt: -1 });

    const currentUserId = req.user?.userId;

    const formattedEvents = events.map((ev) => {
      const isUserRsvpd = currentUserId
        ? ev.rsvps.some((r: any) => (r._id ? r._id.toString() : r.toString()) === currentUserId)
        : false;

      return {
        id: ev._id,
        _id: ev._id,
        title: ev.title,
        type: ev.type,
        category: ev.category,
        date: ev.date,
        time: ev.time,
        location: ev.location,
        description: ev.description,
        image: ev.image,
        maxSlots: ev.maxSlots,
        rsvpCount: ev.rsvps.length,
        isUserRsvpd,
        attendees: ev.rsvps,
      };
    });

    res.json({ success: true, data: formattedEvents });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Failed to fetch events.', error: err.message });
  }
};

export const getEventById = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const event = await Event.findById(req.params.id).populate('rsvps', 'name unit');
    if (!event) {
      res.status(404).json({ success: false, message: 'Event not found.' });
      return;
    }

    const currentUserId = req.user?.userId;
    const isUserRsvpd = currentUserId
      ? event.rsvps.some((r: any) => (r._id ? r._id.toString() : r.toString()) === currentUserId)
      : false;

    res.json({
      success: true,
      data: {
        ...event.toObject(),
        rsvpCount: event.rsvps.length,
        isUserRsvpd,
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Failed to fetch event details.', error: err.message });
  }
};

export const toggleRSVP = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      res.status(404).json({ success: false, message: 'Event not found.' });
      return;
    }

    const userId = new mongoose.Types.ObjectId(req.user!.userId);
    const hasRsvpd = event.rsvps.some((id) => id.toString() === userId.toString());

    if (hasRsvpd) {
      event.rsvps = event.rsvps.filter((id) => id.toString() !== userId.toString());
    } else {
      if (event.rsvps.length >= event.maxSlots) {
        res.status(400).json({ success: false, message: 'RSVP slots are full for this event.' });
        return;
      }
      event.rsvps.push(userId);
    }

    await event.save();

    res.json({
      success: true,
      message: hasRsvpd ? 'RSVP cancelled.' : 'RSVP confirmed! See you at the event.',
      data: {
        isUserRsvpd: !hasRsvpd,
        rsvpCount: event.rsvps.length,
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Failed to update RSVP.', error: err.message });
  }
};

export const createEvent = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { title, type, category, date, time, location, description, image, maxSlots } = req.body;

    if (!title || !date || !time || !location) {
      res.status(400).json({ success: false, message: 'Title, date, time, and location are required.' });
      return;
    }

    const event = await Event.create({
      title,
      type: type || 'Festival Celebration',
      category: category || 'Celebration',
      date,
      time,
      location,
      description: description || '',
      image: image || '',
      maxSlots: Number(maxSlots) || 100,
      rsvps: [],
    });

    await logAuditEvent(req, 'EVENT_CREATE', 'Event', event._id.toString(), { title, date });

    res.status(201).json({ success: true, message: 'Event created successfully.', data: event });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Failed to create event.', error: err.message });
  }
};

export const updateEvent = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const event = await Event.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!event) {
      res.status(404).json({ success: false, message: 'Event not found.' });
      return;
    }

    await logAuditEvent(req, 'EVENT_UPDATE', 'Event', event._id.toString(), req.body);

    res.json({ success: true, message: 'Event updated successfully.', data: event });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Failed to update event.', error: err.message });
  }
};

export const deleteEvent = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const event = await Event.findByIdAndDelete(req.params.id);
    if (!event) {
      res.status(404).json({ success: false, message: 'Event not found.' });
      return;
    }

    await logAuditEvent(req, 'EVENT_DELETE', 'Event', req.params.id, { title: event.title });

    res.json({ success: true, message: 'Event removed successfully.' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Failed to delete event.', error: err.message });
  }
};
