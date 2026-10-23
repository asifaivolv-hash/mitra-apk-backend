import { Router } from 'express';
import { getHelplines, createHelpline, updateHelpline, deleteHelpline } from '../controllers/helplineController';
import { authenticateToken, requireRoles } from '../middleware/auth';

const router = Router();

router.get('/', authenticateToken, getHelplines);
router.post('/', authenticateToken, requireRoles(['admin', 'superadmin']), createHelpline);
router.put('/:id', authenticateToken, requireRoles(['admin', 'superadmin']), updateHelpline);
router.delete('/:id', authenticateToken, requireRoles(['admin', 'superadmin']), deleteHelpline);

export default router;
