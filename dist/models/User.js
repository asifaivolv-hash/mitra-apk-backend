"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.User = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const UserSchema = new mongoose_1.Schema({
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    phone: { type: String, required: true, unique: true, trim: true, index: true },
    passwordHash: { type: String, required: true },
    unit: {
        block: { type: String, default: 'Block A' },
        flat: { type: String, required: true, trim: true },
    },
    role: {
        type: String,
        enum: [
            'member',
            'resident',
            'community_manager',
            'manager',
            'committee',
            'admin',
            'central_admin',
            'superadmin',
        ],
        default: 'member',
        index: true,
    },
    status: {
        type: String,
        enum: ['active', 'pending_approval', 'suspended', 'deactivated'],
        default: 'active',
        index: true,
    },
    communityId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Community', index: true },
    assignedCommunities: [{ type: mongoose_1.Schema.Types.ObjectId, ref: 'Community' }],
    designation: { type: String, default: '' },
    managedBy: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User' },
    privacy: {
        hidePhone: { type: Boolean, default: true },
        allowProxyCalls: { type: Boolean, default: true },
    },
    avatar: { type: String, default: '' },
    fcmToken: { type: String, default: '' },
    notificationPreferences: {
        announcements: { type: Boolean, default: true },
        campaigns: { type: Boolean, default: true },
        events: { type: Boolean, default: true },
        discussions: { type: Boolean, default: true },
    },
}, { timestamps: true });
// Method to verify password
UserSchema.methods.comparePassword = async function (candidatePassword) {
    return bcryptjs_1.default.compare(candidatePassword, this.passwordHash);
};
exports.User = mongoose_1.default.model('User', UserSchema);
