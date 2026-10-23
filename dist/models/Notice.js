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
exports.Announcement = exports.Notice = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const NoticeSchema = new mongoose_1.Schema({
    title: { type: String, required: true, trim: true },
    content: { type: String, required: true },
    category: {
        type: String,
        enum: [
            'Colony Announcement',
            'Community Notice',
            'Maintenance Update',
            'Upcoming Activity',
            'Security Advisory',
            'Official Circular',
        ],
        default: 'Colony Announcement',
        index: true,
    },
    priority: {
        type: String,
        enum: ['normal', 'urgent', 'critical'],
        default: 'normal',
        index: true,
    },
    author: { type: String, default: 'Greenwood Heights Management Committee' },
    image: { type: String, default: '' },
    communityId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Community', index: true },
    targetCommunities: [{ type: mongoose_1.Schema.Types.ObjectId, ref: 'Community' }],
    isPinned: { type: Boolean, default: false },
    status: {
        type: String,
        enum: ['draft', 'scheduled', 'published', 'archived'],
        default: 'published',
        index: true,
    },
    scheduledFor: { type: Date },
    publishedAt: { type: Date, default: Date.now },
    readBy: [{ type: mongoose_1.Schema.Types.ObjectId, ref: 'User' }],
    createdBy: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });
NoticeSchema.index({ status: 1, communityId: 1, publishedAt: -1 });
exports.Notice = mongoose_1.default.model('Notice', NoticeSchema);
exports.Announcement = exports.Notice; // Alias to support Announcement naming seamlessly
