"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const directoryController_1 = require("../controllers/directoryController");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
router.get('/', auth_1.authenticateToken, directoryController_1.getDirectory);
exports.default = router;
