import { Router } from 'express';
import { getDirectory } from '../controllers/directoryController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

router.get('/', authenticateToken, getDirectory);

export default router;
