"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const adminController_1 = require("../controllers/adminController");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
router.use(auth_1.authenticateToken);
// Role-aware dashboard summary
router.get('/summary', (req, res) => {
    const role = (req.user?.role || '').toLowerCase();
    if (role === 'superadmin' || role === 'central_admin') {
        return (0, adminController_1.getCentralAdminMetrics)(req, res);
    }
    return (0, adminController_1.getMetrics)(req, res);
});
router.get('/central', (0, auth_1.requireRoles)(['superadmin', 'central_admin']), adminController_1.getCentralAdminMetrics);
router.get('/community', adminController_1.getMetrics);
exports.default = router;
