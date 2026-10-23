"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const adPosterController_1 = require("../controllers/adPosterController");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// Public / Mobile feed routes (authenticated residents & members)
router.get('/public', auth_1.authenticateToken, adPosterController_1.getPublicAds);
router.post('/:id/click', auth_1.authenticateToken, adPosterController_1.recordAdClick);
// Campaign listing (role-restricted filtering handled in controller)
router.get('/', auth_1.authenticateToken, adPosterController_1.getAllAds);
router.get('/:id', auth_1.authenticateToken, adPosterController_1.getAdById);
router.get('/:id/analytics', auth_1.authenticateToken, adPosterController_1.getAdAnalytics);
// Create campaign (Manager, Admin, Central Admin)
router.post('/', auth_1.authenticateToken, (0, auth_1.requireRoles)(['community_manager', 'manager', 'committee', 'admin', 'superadmin', 'central_admin']), adPosterController_1.createAd);
// Submit for approval (Creator / Manager)
router.post('/:id/submit', auth_1.authenticateToken, adPosterController_1.submitAdForApproval);
// Approve or Reject (Admin or Central Admin ONLY)
router.post('/:id/approve', auth_1.authenticateToken, (0, auth_1.requireRoles)(['admin', 'superadmin', 'central_admin']), adPosterController_1.approveAd);
router.post('/:id/reject', auth_1.authenticateToken, (0, auth_1.requireRoles)(['admin', 'superadmin', 'central_admin']), adPosterController_1.rejectAd);
// Archive
router.post('/:id/archive', auth_1.authenticateToken, (0, auth_1.requireRoles)(['admin', 'superadmin', 'central_admin', 'community_manager']), adPosterController_1.archiveAd);
// Update & Delete
router.put('/:id', auth_1.authenticateToken, adPosterController_1.updateAd);
router.patch('/:id', auth_1.authenticateToken, adPosterController_1.updateAd);
router.delete('/:id', auth_1.authenticateToken, (0, auth_1.requireRoles)(['admin', 'superadmin', 'central_admin', 'community_manager']), adPosterController_1.deleteAd);
exports.default = router;
