import { Router } from 'express';
import { getCommitteeMembers, createCommitteeMember, updateCommitteeMember, deleteCommitteeMember } from '../controllers/committeeController';
import { authenticateToken, requireRoles } from '../middleware/auth';

const router = Router();

router.get('/', authenticateToken, getCommitteeMembers);
router.post('/', authenticateToken, requireRoles(['admin', 'superadmin']), createCommitteeMember);
router.put('/:id', authenticateToken, requireRoles(['admin', 'superadmin']), updateCommitteeMember);
router.delete('/:id', authenticateToken, requireRoles(['admin', 'superadmin']), deleteCommitteeMember);

export default router;
