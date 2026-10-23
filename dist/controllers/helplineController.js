"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteHelpline = exports.updateHelpline = exports.createHelpline = exports.getHelplines = void 0;
const Helpline_1 = require("../models/Helpline");
const audit_1 = require("../middleware/audit");
const getHelplines = async (req, res) => {
    try {
        const helplines = await Helpline_1.Helpline.find({ isActive: true }).sort({ priority: 1, createdAt: 1 });
        res.json({ success: true, data: helplines });
    }
    catch (err) {
        res.status(500).json({ success: false, message: 'Failed to fetch helplines.', error: err.message });
    }
};
exports.getHelplines = getHelplines;
const createHelpline = async (req, res) => {
    try {
        const { title, subtitle, extension, phoneNumber, category, tag, priority } = req.body;
        if (!title || !phoneNumber) {
            res.status(400).json({ success: false, message: 'Title and phone number are required.' });
            return;
        }
        const helpline = await Helpline_1.Helpline.create({
            title,
            subtitle: subtitle || 'Society Contact',
            extension: extension || '',
            phoneNumber,
            category: category || 'emergency',
            tag: tag || 'Immediate Response',
            priority: Number(priority) || 0,
            isActive: true,
        });
        await (0, audit_1.logAuditEvent)(req, 'HELPLINE_CREATE', 'Helpline', helpline._id.toString(), { title, phoneNumber });
        res.status(201).json({ success: true, message: 'Helpline added successfully.', data: helpline });
    }
    catch (err) {
        res.status(500).json({ success: false, message: 'Failed to create helpline.', error: err.message });
    }
};
exports.createHelpline = createHelpline;
const updateHelpline = async (req, res) => {
    try {
        const helpline = await Helpline_1.Helpline.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!helpline) {
            res.status(404).json({ success: false, message: 'Helpline not found.' });
            return;
        }
        await (0, audit_1.logAuditEvent)(req, 'HELPLINE_UPDATE', 'Helpline', helpline._id.toString(), req.body);
        res.json({ success: true, message: 'Helpline updated successfully.', data: helpline });
    }
    catch (err) {
        res.status(500).json({ success: false, message: 'Failed to update helpline.', error: err.message });
    }
};
exports.updateHelpline = updateHelpline;
const deleteHelpline = async (req, res) => {
    try {
        const helpline = await Helpline_1.Helpline.findByIdAndDelete(req.params.id);
        if (!helpline) {
            res.status(404).json({ success: false, message: 'Helpline not found.' });
            return;
        }
        await (0, audit_1.logAuditEvent)(req, 'HELPLINE_DELETE', 'Helpline', req.params.id, { title: helpline.title });
        res.json({ success: true, message: 'Helpline removed.' });
    }
    catch (err) {
        res.status(500).json({ success: false, message: 'Failed to delete helpline.', error: err.message });
    }
};
exports.deleteHelpline = deleteHelpline;
