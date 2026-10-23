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
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdPoster = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const ApprovalHistorySchema = new mongoose_1.Schema({
    status: { type: String, required: true },
    changedBy: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true },
    note: { type: String, default: '' },
    timestamp: { type: Date, default: Date.now },
}, { _id: false });
const AdPosterSchema = new mongoose_1.Schema({
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    badgeText: { type: String, default: 'SPONSORED' },
    imageUrl: { type: String, required: true },
    targetUrl: { type: String, default: '' },
    contactAction: { type: String, default: '' },
    category: {
        type: String,
        enum: ['Business Ad', 'Community Poster', 'Sponsorship', 'Notice Poster', 'Promotion'],
        default: 'Business Ad',
    },
    communityId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Community', index: true },
    targetCommunities: [{ type: mongoose_1.Schema.Types.ObjectId, ref: 'Community' }],
    isGlobal: { type: Boolean, default: false },
    status: {
        type: String,
        enum: [
            'draft',
            'submitted',
            'pending_approval',
            'approved',
            'scheduled',
            'published',
            'active',
            'paused',
            'expired',
            'rejected',
            'archived',
        ],
        default: 'active',
        index: true,
    },
    rejectionReason: { type: String, default: '' },
    approvalHistory: [ApprovalHistorySchema],
    impressions: { type: Number, default: 0 },
    clicks: { type: Number, default: 0 },
    startDate: { type: Date, default: Date.now },
    endDate: { type: Date },
    createdBy: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', index: true },
    approvedBy: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User' },
    approvedAt: { type: Date },
}, { timestamps: true });
AdPosterSchema.index({ status: 1, communityId: 1, startDate: 1, endDate: 1 });
exports.AdPoster = mongoose_1.default.model('AdPoster', AdPosterSchema);
