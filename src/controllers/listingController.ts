import { Response } from 'express';
import { Listing } from '../models/Listing';
import { AuthenticatedRequest } from '../middleware/auth';
import { logAuditEvent } from '../middleware/audit';

export const getListings = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { type, category, status = 'active' } = req.query;
    const filter: any = {};

    if (status && status !== 'all') {
      filter.status = status;
    }

    if (type && type !== 'All') {
      filter.type = type;
    }

    if (category && category !== 'All') {
      filter.category = category;
    }

    const listings = await Listing.find(filter).sort({ createdAt: -1 });

    res.json({ success: true, data: listings });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Failed to fetch listings.', error: err.message });
  }
};

export const createListing = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { title, type, category, price, condition, location, contactType, image } = req.body;

    if (!title || !price) {
      res.status(400).json({ success: false, message: 'Title and price are required.' });
      return;
    }

    const user = req.user!;
    const userLocation = location || `${user.unit?.block || 'Block A'} • Flat ${user.unit?.flat || 'Resident'}`;

    const listing = await Listing.create({
      title,
      type: type || 'Buy',
      category: category || 'Furniture',
      price: price.startsWith('₹') ? price : `₹${price}`,
      condition: condition || 'Good Condition',
      location: userLocation,
      sellerId: user.userId,
      sellerName: user.name,
      contactType: contactType || 'proxy_call',
      image: image || 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=600&auto=format&fit=crop&q=80',
      verified: true,
      status: 'active',
    });

    res.status(201).json({ success: true, message: 'Listing posted successfully.', data: listing });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Failed to create listing.', error: err.message });
  }
};

export const updateListing = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const listing = await Listing.findById(req.params.id);
    if (!listing) {
      res.status(404).json({ success: false, message: 'Listing not found.' });
      return;
    }

    const isOwner = listing.sellerId.toString() === req.user?.userId;
    const isAdmin = ['admin', 'superadmin', 'committee'].includes(req.user?.role || '');

    if (!isOwner && !isAdmin) {
      res.status(403).json({ success: false, message: 'Unauthorized to modify this listing.' });
      return;
    }

    Object.assign(listing, req.body);
    await listing.save();

    res.json({ success: true, message: 'Listing updated.', data: listing });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Failed to update listing.', error: err.message });
  }
};

export const deleteListing = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const listing = await Listing.findById(req.params.id);
    if (!listing) {
      res.status(404).json({ success: false, message: 'Listing not found.' });
      return;
    }

    const isOwner = listing.sellerId.toString() === req.user?.userId;
    const isAdmin = ['admin', 'superadmin', 'committee'].includes(req.user?.role || '');

    if (!isOwner && !isAdmin) {
      res.status(403).json({ success: false, message: 'Unauthorized to delete this listing.' });
      return;
    }

    await listing.deleteOne();

    if (isAdmin && !isOwner) {
      await logAuditEvent(req, 'LISTING_MODERATE_DELETE', 'Listing', req.params.id, { title: listing.title });
    }

    res.json({ success: true, message: 'Listing removed successfully.' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Failed to delete listing.', error: err.message });
  }
};
