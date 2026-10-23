import { Router } from 'express';
import { getMetrics, getCentralAdminMetrics } from '../controllers/adminController';
import { authenticateToken, requireRoles } from '../middleware/auth';

const router = Router();

router.use(authenticateToken);

// Role-aware dashboard summary
router.get('/summary', (req: any, res: any) => {
  const role = (req.user?.role || '').toLowerCase();
  if (role === 'superadmin' || role === 'central_admin') {
    return getCentralAdminMetrics(req, res);
  }
  return getMetrics(req, res);
});

router.get('/central', requireRoles(['superadmin', 'central_admin']), getCentralAdminMetrics);
router.get('/community', getMetrics);

export default router;
