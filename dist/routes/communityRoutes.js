"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const communityController_1 = require("../controllers/communityController");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// Public / Authenticated listing
router.get('/', communityController_1.getAllCommunities);
router.get('/:id', communityController_1.getCommunityDetails);
// Protected routes
router.use(auth_1.authenticateToken);
// Create community (Admin / Central Admin)
router.post('/', (0, auth_1.requireRoles)(['admin', 'superadmin', 'central_admin']), communityController_1.createCommunity);
// Update details & status
router.put('/:id', (0, auth_1.requireRoles)(['admin', 'superadmin', 'central_admin', 'community_manager']), communityController_1.updateCommunity);
router.patch('/:id', (0, auth_1.requireRoles)(['admin', 'superadmin', 'central_admin', 'community_manager']), communityController_1.updateCommunity);
router.patch('/:id/status', (0, auth_1.requireRoles)(['admin', 'superadmin', 'central_admin']), communityController_1.updateCommunityStatus);
// Members
router.get('/:id/members', communityController_1.getCommunityMembers);
router.post('/:id/join', communityController_1.joinCommunity);
router.patch('/:id/members/:userId', (0, auth_1.requireRoles)(['community_manager', 'manager', 'admin', 'superadmin', 'central_admin']), communityController_1.updateMemberStatus);
exports.default = router;
