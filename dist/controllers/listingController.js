"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteListing = exports.updateListing = exports.createListing = exports.getListings = void 0;
const Listing_1 = require("../models/Listing");
const audit_1 = require("../middleware/audit");
const getListings = async (req, res) => {
    try {
        const { type, category, status = 'active' } = req.query;
        const filter = {};
        if (status && status !== 'all') {
            filter.status = status;
        }
        if (type && type !== 'All') {
            filter.type = type;
        }
        if (category && category !== 'All') {
            filter.category = category;
        }
        const listings = await Listing_1.Listing.find(filter).sort({ createdAt: -1 });
        res.json({ success: true, data: listings });
    }
    catch (err) {
        res.status(500).json({ success: false, message: 'Failed to fetch listings.', error: err.message });
    }
};
exports.getListings = getListings;
const createListing = async (req, res) => {
    try {
        const { title, type, category, price, condition, location, contactType, image } = req.body;
        if (!title || !price) {
            res.status(400).json({ success: false, message: 'Title and price are required.' });
            return;
        }
        const user = req.user;
        const userLocation = location || `${user.unit?.block || 'Block A'} • Flat ${user.unit?.flat || 'Resident'}`;
        const listing = await Listing_1.Listing.create({
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
    }
    catch (err) {
        res.status(500).json({ success: false, message: 'Failed to create listing.', error: err.message });
    }
};
exports.createListing = createListing;
const updateListing = async (req, res) => {
    try {
        const listing = await Listing_1.Listing.findById(req.params.id);
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
    }
    catch (err) {
        res.status(500).json({ success: false, message: 'Failed to update listing.', error: err.message });
    }
};
exports.updateListing = updateListing;
const deleteListing = async (req, res) => {
    try {
        const listing = await Listing_1.Listing.findById(req.params.id);
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
            await (0, audit_1.logAuditEvent)(req, 'LISTING_MODERATE_DELETE', 'Listing', req.params.id, { title: listing.title });
        }
        res.json({ success: true, message: 'Listing removed successfully.' });
    }
    catch (err) {
        res.status(500).json({ success: false, message: 'Failed to delete listing.', error: err.message });
    }
};
exports.deleteListing = deleteListing;
