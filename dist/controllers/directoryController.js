"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDirectory = void 0;
const User_1 = require("../models/User");
const getDirectory = async (req, res) => {
    try {
        const { search, block } = req.query;
        const filter = { status: 'active' };
        if (block && block !== 'All') {
            filter['unit.block'] = block;
        }
        if (search) {
            const searchRegex = new RegExp(search, 'i');
            filter.$or = [
                { name: searchRegex },
                { 'unit.flat': searchRegex },
                { 'unit.block': searchRegex },
            ];
        }
        const residents = await User_1.User.find(filter)
            .select('name unit role status privacy phone avatar createdAt')
            .sort({ 'unit.block': 1, 'unit.flat': 1 });
        const isAdmin = ['admin', 'superadmin', 'committee'].includes(req.user?.role || '');
        const maskedDirectory = residents.map((r) => {
            let displayPhone = r.phone;
            if (!isAdmin && r.privacy?.hidePhone && r.phone) {
                // Mask phone number: e.g. +91 98765 43210 -> +91 98*** **210
                const len = r.phone.length;
                if (len > 6) {
                    displayPhone = r.phone.substring(0, 4) + '******' + r.phone.substring(len - 2);
                }
                else {
                    displayPhone = '******';
                }
            }
            return {
                id: r._id,
                _id: r._id,
                name: r.name,
                unit: `${r.unit?.block || 'Block A'} - Flat ${r.unit?.flat || ''}`,
                block: r.unit?.block || 'Block A',
                flat: r.unit?.flat || '',
                role: r.role,
                verified: true,
                phone: displayPhone,
                allowProxyCalls: r.privacy?.allowProxyCalls ?? true,
                avatar: r.avatar,
            };
        });
        res.json({ success: true, data: maskedDirectory });
    }
    catch (err) {
        res.status(500).json({ success: false, message: 'Failed to fetch directory.', error: err.message });
    }
};
exports.getDirectory = getDirectory;
