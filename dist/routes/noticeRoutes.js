"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const noticeController_1 = require("../controllers/noticeController");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
router.use(auth_1.authenticateToken);
router.get('/', noticeController_1.getNotices);
router.get('/:id', noticeController_1.getNoticeById);
router.post('/:id/read', noticeController_1.markNoticeRead);
// Protected actions for Committee, Managers, Admins
router.post('/', (0, auth_1.requireRoles)(['committee', 'community_manager', 'manager', 'admin', 'superadmin', 'central_admin']), noticeController_1.createNotice);
router.post('/:id/publish', (0, auth_1.requireRoles)(['committee', 'community_manager', 'manager', 'admin', 'superadmin', 'central_admin']), noticeController_1.publishNotice);
router.put('/:id', (0, auth_1.requireRoles)(['committee', 'community_manager', 'manager', 'admin', 'superadmin', 'central_admin']), noticeController_1.updateNotice);
router.patch('/:id', (0, auth_1.requireRoles)(['committee', 'community_manager', 'manager', 'admin', 'superadmin', 'central_admin']), noticeController_1.updateNotice);
router.delete('/:id', (0, auth_1.requireRoles)(['admin', 'superadmin', 'central_admin']), noticeController_1.deleteNotice);
exports.default = router;
