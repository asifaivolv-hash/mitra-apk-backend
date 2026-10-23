import { Router } from 'express';
import { getEvents, getEventById, toggleRSVP, createEvent, updateEvent, deleteEvent } from '../controllers/eventController';
import { authenticateToken, requireRoles } from '../middleware/auth';

const router = Router();

router.get('/', authenticateToken, getEvents);
router.get('/:id', authenticateToken, getEventById);
router.post('/:id/rsvp', authenticateToken, toggleRSVP);
router.post('/', authenticateToken, requireRoles(['admin', 'superadmin', 'committee']), createEvent);
router.put('/:id', authenticateToken, requireRoles(['admin', 'superadmin', 'committee']), updateEvent);
router.delete('/:id', authenticateToken, requireRoles(['admin', 'superadmin']), deleteEvent);

export default router;
