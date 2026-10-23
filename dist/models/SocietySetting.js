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
exports.SocietySetting = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const SocietySettingSchema = new mongoose_1.Schema({
    societyName: { type: String, default: 'Greenwood Heights Society' },
    tagline: { type: String, default: 'Stronger Together' },
    address: { type: String, default: 'Financial District, Nanakramguda' },
    city: { type: String, default: 'Hyderabad' },
    totalFlats: { type: Number, default: 520 },
    adBanner: {
        enabled: { type: Boolean, default: true },
        badgeText: { type: String, default: 'YOUR AD HERE' },
        title: { type: String, default: 'Reach 500+ Families in your Community' },
        subtitle: { type: String, default: 'Promote local businesses and services directly to verified neighbours.' },
        ctaText: { type: String, default: 'Post Ad Now' },
        targetUrl: { type: String, default: '/classifieds' },
    },
    contactEmail: { type: String, default: 'office@greenwoodheights.org' },
    contactPhone: { type: String, default: '+91 40 2345 6789' },
}, { timestamps: true });
exports.SocietySetting = mongoose_1.default.model('SocietySetting', SocietySettingSchema);
