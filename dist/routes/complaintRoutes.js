"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const complaintController_1 = require("../controllers/complaintController");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
router.use(auth_1.authenticateToken);
// Resident routes
router.post('/', complaintController_1.createComplaint);
router.get('/my', complaintController_1.getMyComplaints);
// Manager and Admin routes
router.get('/', (0, auth_1.requireRoles)(['community_manager', 'committee', 'admin', 'superadmin']), complaintController_1.getAllComplaints);
router.get('/metrics', (0, auth_1.requireRoles)(['community_manager', 'committee', 'admin', 'superadmin']), complaintController_1.getComplaintMetrics);
router.put('/:id/status', (0, auth_1.requireRoles)(['community_manager', 'committee', 'admin', 'superadmin']), complaintController_1.updateComplaintStatus);
exports.default = router;
