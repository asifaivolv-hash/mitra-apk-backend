import { Router } from 'express';
import { getListings, createListing, updateListing, deleteListing } from '../controllers/listingController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

router.get('/', authenticateToken, getListings);
router.post('/', authenticateToken, createListing);
router.put('/:id', authenticateToken, updateListing);
router.delete('/:id', authenticateToken, deleteListing);

export default router;
