"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteCommitteeMember = exports.updateCommitteeMember = exports.createCommitteeMember = exports.getCommitteeMembers = void 0;
const CommitteeMember_1 = require("../models/CommitteeMember");
const audit_1 = require("../middleware/audit");
const getCommitteeMembers = async (req, res) => {
    try {
        const members = await CommitteeMember_1.CommitteeMember.find({ isActive: true }).sort({ displayOrder: 1, createdAt: 1 });
        res.json({ success: true, data: members });
    }
    catch (err) {
        res.status(500).json({ success: false, message: 'Failed to fetch committee members.', error: err.message });
    }
};
exports.getCommitteeMembers = getCommitteeMembers;
const createCommitteeMember = async (req, res) => {
    try {
        const { role, name, unit, tenure, focus, phoneNumber, email, initials, avatarBg, badgeColor, displayOrder } = req.body;
        if (!role || !name || !unit || !focus) {
            res.status(400).json({ success: false, message: 'Role, name, unit, and focus are required.' });
            return;
        }
        const member = await CommitteeMember_1.CommitteeMember.create({
            role,
            name,
            unit,
            tenure: tenure || 'Tenure: 2025 – 2027',
            focus,
            phoneNumber: phoneNumber || '+91 98765 00000',
            email: email || 'committee@greenwoodheights.org',
            initials: initials || name.split(' ').map((n) => n[0]).join('').substring(0, 2).toUpperCase(),
            avatarBg: avatarBg || 'bg-[#060E57]',
            badgeColor: badgeColor || 'bg-blue-100 text-[#060E57]',
            displayOrder: Number(displayOrder) || 0,
            isActive: true,
        });
        await (0, audit_1.logAuditEvent)(req, 'COMMITTEE_CREATE', 'CommitteeMember', member._id.toString(), { name, role });
        res.status(201).json({ success: true, message: 'Committee member added.', data: member });
    }
    catch (err) {
        res.status(500).json({ success: false, message: 'Failed to create committee member.', error: err.message });
    }
};
exports.createCommitteeMember = createCommitteeMember;
const updateCommitteeMember = async (req, res) => {
    try {
        const member = await CommitteeMember_1.CommitteeMember.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!member) {
            res.status(404).json({ success: false, message: 'Committee member not found.' });
            return;
        }
        await (0, audit_1.logAuditEvent)(req, 'COMMITTEE_UPDATE', 'CommitteeMember', member._id.toString(), req.body);
        res.json({ success: true, message: 'Committee member updated.', data: member });
    }
    catch (err) {
        res.status(500).json({ success: false, message: 'Failed to update committee member.', error: err.message });
    }
};
exports.updateCommitteeMember = updateCommitteeMember;
const deleteCommitteeMember = async (req, res) => {
    try {
        const member = await CommitteeMember_1.CommitteeMember.findByIdAndDelete(req.params.id);
        if (!member) {
            res.status(404).json({ success: false, message: 'Committee member not found.' });
            return;
        }
        await (0, audit_1.logAuditEvent)(req, 'COMMITTEE_DELETE', 'CommitteeMember', req.params.id, { name: member.name });
        res.json({ success: true, message: 'Committee member removed.' });
    }
    catch (err) {
        res.status(500).json({ success: false, message: 'Failed to delete committee member.', error: err.message });
    }
};
exports.deleteCommitteeMember = deleteCommitteeMember;
