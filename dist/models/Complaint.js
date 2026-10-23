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
exports.Complaint = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const ComplaintSchema = new mongoose_1.Schema({
    referenceNo: { type: String, unique: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    category: {
        type: String,
        enum: ['Maintenance', 'Electrical', 'Plumbing', 'Security', 'Noise', 'Common Area', 'Sanitation', 'Other'],
        default: 'Maintenance',
    },
    priority: {
        type: String,
        enum: ['low', 'medium', 'high', 'urgent'],
        default: 'medium',
    },
    status: {
        type: String,
        enum: ['pending', 'in_progress', 'resolved', 'rejected'],
        default: 'pending',
    },
    communityId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Community' },
    userId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true },
    userName: { type: String, required: true },
    userPhone: { type: String, required: true },
    unit: {
        block: { type: String, default: 'Block A' },
        flat: { type: String, required: true },
    },
    assignedTo: { type: String, default: 'Unassigned' },
    resolutionNotes: { type: String, default: '' },
    resolvedAt: { type: Date },
    images: [{ type: String }],
}, { timestamps: true });
ComplaintSchema.pre('validate', function (next) {
    if (!this.referenceNo) {
        const randomSuffix = Math.floor(1000 + Math.random() * 9000);
        this.referenceNo = `CMP-${new Date().getFullYear()}-${randomSuffix}`;
    }
    next();
});
exports.Complaint = mongoose_1.default.model('Complaint', ComplaintSchema);
