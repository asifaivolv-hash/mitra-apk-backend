"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateProfile = exports.getMe = exports.changePassword = exports.resetPassword = exports.forgotPassword = exports.logout = exports.refreshToken = exports.adminLogin = exports.login = exports.register = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const crypto_1 = __importDefault(require("crypto"));
const User_1 = require("../models/User");
const RefreshToken_1 = require("../models/RefreshToken");
const DeviceToken_1 = require("../models/DeviceToken");
const jwt_1 = require("../utils/jwt");
const register = async (req, res) => {
    try {
        const { name, email, phone, password, unit, communityId } = req.body;
        if (!name || !email || !phone || !password || !unit || !unit.flat) {
            res.status(400).json({ success: false, message: 'All fields including flat details are required.' });
            return;
        }
        const existingUser = await User_1.User.findOne({
            $or: [{ email: email.toLowerCase().trim() }, { phone: phone.trim() }],
        });
        if (existingUser) {
            res.status(409).json({ success: false, message: 'An account with this email or phone already exists.' });
            return;
        }
        const salt = await bcryptjs_1.default.genSalt(10);
        const passwordHash = await bcryptjs_1.default.hash(password, salt);
        const user = await User_1.User.create({
            name: name.trim(),
            email: email.toLowerCase().trim(),
            phone: phone.trim(),
            passwordHash,
            unit: {
                block: unit.block || 'Block A',
                flat: unit.flat.trim(),
            },
            role: 'member',
            status: 'active',
            communityId: communityId || undefined,
            privacy: {
                hidePhone: true,
                allowProxyCalls: true,
            },
        });
        const tokenPayload = {
            userId: user._id.toString(),
            email: user.email,
            role: user.role,
            name: user.name,
            communityId: user.communityId?.toString(),
            unit: user.unit,
        };
        const accessToken = (0, jwt_1.generateAccessToken)(tokenPayload);
        const refreshToken = (0, jwt_1.generateRefreshToken)(tokenPayload);
        // Store refresh token
        const tokenHash = crypto_1.default.createHash('sha256').update(refreshToken).digest('hex');
        await RefreshToken_1.RefreshToken.create({
            userId: user._id,
            tokenHash,
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            ipAddress: req.ip || '',
        });
        res.status(201).json({
            success: true,
            message: 'Account created successfully.',
            data: {
                user: {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    phone: user.phone,
                    unit: user.unit,
                    role: user.role,
                    communityId: user.communityId,
                    privacy: user.privacy,
                },
                accessToken,
                refreshToken,
            },
        });
    }
    catch (err) {
        res.status(500).json({ success: false, message: 'Registration failed.', error: err.message });
    }
};
exports.register = register;
const login = async (req, res) => {
    try {
        const { email, phone, loginId, password } = req.body;
        const identifier = (email || phone || loginId || '').toLowerCase().trim();
        if (!identifier || !password) {
            res.status(400).json({ success: false, message: 'Email/Phone and password are required.' });
            return;
        }
        const user = await User_1.User.findOne({
            $or: [{ email: identifier }, { phone: identifier }],
        }).populate('communityId', 'name code city address');
        if (!user) {
            res.status(401).json({ success: false, message: 'Invalid credentials. User not found.' });
            return;
        }
        if (user.status === 'suspended' || user.status === 'deactivated') {
            res.status(403).json({ success: false, message: 'Your account is suspended. Please contact community administration.' });
            return;
        }
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            res.status(401).json({ success: false, message: 'Invalid password. Please verify and try again.' });
            return;
        }
        const tokenPayload = {
            userId: user._id.toString(),
            email: user.email,
            role: user.role,
            name: user.name,
            communityId: user.communityId ? user.communityId._id?.toString() || user.communityId.toString() : undefined,
            assignedCommunities: user.assignedCommunities?.map((c) => c.toString()),
            unit: user.unit,
        };
        const accessToken = (0, jwt_1.generateAccessToken)(tokenPayload);
        const refreshToken = (0, jwt_1.generateRefreshToken)(tokenPayload);
        // Save refresh token
        const tokenHash = crypto_1.default.createHash('sha256').update(refreshToken).digest('hex');
        await RefreshToken_1.RefreshToken.create({
            userId: user._id,
            tokenHash,
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            ipAddress: req.ip || '',
        });
        res.json({
            success: true,
            message: 'Login successful.',
            data: {
                user: {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    phone: user.phone,
                    unit: user.unit,
                    role: user.role,
                    community: user.communityId,
                    privacy: user.privacy,
                    avatar: user.avatar,
                },
                accessToken,
                refreshToken,
            },
        });
    }
    catch (err) {
        res.status(500).json({ success: false, message: 'Login failed.', error: err.message });
    }
};
exports.login = login;
const adminLogin = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            res.status(400).json({ success: false, message: 'Admin email and password are required.' });
            return;
        }
        const user = await User_1.User.findOne({ email: email.toLowerCase().trim() }).populate('communityId', 'name code city address');
        if (!user) {
            res.status(401).json({ success: false, message: 'Administrator record not found.' });
            return;
        }
        const privilegedRoles = ['admin', 'superadmin', 'central_admin', 'community_manager', 'manager', 'committee'];
        if (!privilegedRoles.includes(user.role)) {
            res.status(403).json({ success: false, message: 'Access Denied: Insufficient administrative privileges.' });
            return;
        }
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            res.status(401).json({ success: false, message: 'Invalid administrative password.' });
            return;
        }
        const tokenPayload = {
            userId: user._id.toString(),
            email: user.email,
            role: user.role,
            name: user.name,
            communityId: user.communityId ? user.communityId._id?.toString() || user.communityId.toString() : undefined,
            assignedCommunities: user.assignedCommunities?.map((c) => c.toString()),
            unit: user.unit,
        };
        const accessToken = (0, jwt_1.generateAccessToken)(tokenPayload);
        const refreshToken = (0, jwt_1.generateRefreshToken)(tokenPayload);
        res.json({
            success: true,
            message: 'Administrator authenticated successfully.',
            data: {
                user: {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                    community: user.communityId,
                    assignedCommunities: user.assignedCommunities,
                },
                accessToken,
                refreshToken,
            },
        });
    }
    catch (err) {
        res.status(500).json({ success: false, message: 'Admin login failed.', error: err.message });
    }
};
exports.adminLogin = adminLogin;
const refreshToken = async (req, res) => {
    try {
        const { refreshToken: incomingToken } = req.body;
        if (!incomingToken) {
            res.status(400).json({ success: false, message: 'Refresh token is required.' });
            return;
        }
        const decoded = (0, jwt_1.verifyRefreshToken)(incomingToken);
        const user = await User_1.User.findById(decoded.userId);
        if (!user || user.status === 'suspended' || user.status === 'deactivated') {
            res.status(403).json({ success: false, message: 'User account is no longer active.' });
            return;
        }
        const tokenPayload = {
            userId: user._id.toString(),
            email: user.email,
            role: user.role,
            name: user.name,
            communityId: user.communityId?.toString(),
            assignedCommunities: user.assignedCommunities?.map((c) => c.toString()),
            unit: user.unit,
        };
        const newAccessToken = (0, jwt_1.generateAccessToken)(tokenPayload);
        const newRefreshToken = (0, jwt_1.generateRefreshToken)(tokenPayload);
        res.json({
            success: true,
            accessToken: newAccessToken,
            refreshToken: newRefreshToken,
        });
    }
    catch (err) {
        res.status(403).json({ success: false, message: 'Expired or invalid session token.', error: err.message });
    }
};
exports.refreshToken = refreshToken;
const logout = async (req, res) => {
    try {
        const userId = req.user?.userId;
        const { token } = req.body;
        if (token) {
            const tokenHash = crypto_1.default.createHash('sha256').update(token).digest('hex');
            await RefreshToken_1.RefreshToken.findOneAndUpdate({ tokenHash }, { revoked: true });
        }
        else if (userId) {
            await RefreshToken_1.RefreshToken.updateMany({ userId }, { revoked: true });
        }
        if (userId) {
            await DeviceToken_1.DeviceToken.deleteMany({ userId });
        }
        res.json({ success: true, message: 'Logged out successfully.' });
    }
    catch (err) {
        res.status(500).json({ success: false, message: 'Logout failed.', error: err.message });
    }
};
exports.logout = logout;
const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) {
            res.status(400).json({ success: false, message: 'Email address is required.' });
            return;
        }
        const user = await User_1.User.findOne({ email: email.toLowerCase().trim() });
        if (!user) {
            // Return success to avoid email enumeration
            res.json({ success: true, message: 'If this email is registered, a password reset link has been dispatched.' });
            return;
        }
        // Generate mock reset token or send via configured email provider
        res.json({
            success: true,
            message: 'Password reset instructions have been dispatched to your email.',
            resetToken: 'mitra_reset_token_demo_mode',
        });
    }
    catch (err) {
        res.status(500).json({ success: false, message: 'Password reset request failed.', error: err.message });
    }
};
exports.forgotPassword = forgotPassword;
const resetPassword = async (req, res) => {
    try {
        const { email, resetToken, newPassword } = req.body;
        if (!email || !newPassword) {
            res.status(400).json({ success: false, message: 'Email and new password are required.' });
            return;
        }
        const user = await User_1.User.findOne({ email: email.toLowerCase().trim() });
        if (!user) {
            res.status(404).json({ success: false, message: 'User not found.' });
            return;
        }
        const salt = await bcryptjs_1.default.genSalt(10);
        user.passwordHash = await bcryptjs_1.default.hash(newPassword, salt);
        await user.save();
        res.json({ success: true, message: 'Password reset successfully. You can now log in.' });
    }
    catch (err) {
        res.status(500).json({ success: false, message: 'Failed to reset password.', error: err.message });
    }
};
exports.resetPassword = resetPassword;
const changePassword = async (req, res) => {
    try {
        const userId = req.user?.userId;
        const { currentPassword, newPassword } = req.body;
        if (!currentPassword || !newPassword) {
            res.status(400).json({ success: false, message: 'Current password and new password are required.' });
            return;
        }
        const user = await User_1.User.findById(userId);
        if (!user) {
            res.status(404).json({ success: false, message: 'User not found.' });
            return;
        }
        const isMatch = await user.comparePassword(currentPassword);
        if (!isMatch) {
            res.status(400).json({ success: false, message: 'Current password does not match.' });
            return;
        }
        const salt = await bcryptjs_1.default.genSalt(10);
        user.passwordHash = await bcryptjs_1.default.hash(newPassword, salt);
        await user.save();
        res.json({ success: true, message: 'Password changed successfully.' });
    }
    catch (err) {
        res.status(500).json({ success: false, message: 'Failed to change password.', error: err.message });
    }
};
exports.changePassword = changePassword;
const getMe = async (req, res) => {
    try {
        if (!req.user) {
            res.status(401).json({ success: false, message: 'Unauthorized' });
            return;
        }
        const user = await User_1.User.findById(req.user.userId)
            .select('-passwordHash')
            .populate('communityId', 'name code city address bannerImage logo')
            .populate('assignedCommunities', 'name code city');
        if (!user) {
            res.status(404).json({ success: false, message: 'User not found' });
            return;
        }
        res.json({
            success: true,
            data: user,
        });
    }
    catch (err) {
        res.status(500).json({ success: false, message: 'Failed to retrieve profile.', error: err.message });
    }
};
exports.getMe = getMe;
const updateProfile = async (req, res) => {
    try {
        if (!req.user) {
            res.status(401).json({ success: false, message: 'Unauthorized' });
            return;
        }
        const { name, phone, unit, privacy, avatar } = req.body;
        const user = await User_1.User.findById(req.user.userId);
        if (!user) {
            res.status(404).json({ success: false, message: 'User not found' });
            return;
        }
        if (name)
            user.name = name.trim();
        if (phone)
            user.phone = phone.trim();
        if (avatar !== undefined)
            user.avatar = avatar;
        if (unit) {
            if (unit.block)
                user.unit.block = unit.block;
            if (unit.flat)
                user.unit.flat = unit.flat.trim();
        }
        if (privacy) {
            if (typeof privacy.hidePhone === 'boolean')
                user.privacy.hidePhone = privacy.hidePhone;
            if (typeof privacy.allowProxyCalls === 'boolean')
                user.privacy.allowProxyCalls = privacy.allowProxyCalls;
        }
        await user.save();
        res.json({
            success: true,
            message: 'Profile updated successfully.',
            data: {
                id: user._id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                unit: user.unit,
                privacy: user.privacy,
                avatar: user.avatar,
            },
        });
    }
    catch (err) {
        res.status(500).json({ success: false, message: 'Failed to update profile.', error: err.message });
    }
};
exports.updateProfile = updateProfile;
