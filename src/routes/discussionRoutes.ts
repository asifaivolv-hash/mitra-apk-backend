import { Router } from 'express';
import { getDiscussions, createDiscussion, toggleLike, addComment, deleteDiscussion } from '../controllers/discussionController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

router.get('/', authenticateToken, getDiscussions);
router.post('/', authenticateToken, createDiscussion);
router.post('/:id/like', authenticateToken, toggleLike);
router.post('/:id/comments', authenticateToken, addComment);
router.delete('/:id', authenticateToken, deleteDiscussion);

export default router;
