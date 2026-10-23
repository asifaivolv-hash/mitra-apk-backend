import mongoose, { Schema, Document } from 'mongoose';

export type AdPosterStatus =
  | 'draft'
  | 'submitted'
  | 'pending_approval'
  | 'approved'
  | 'scheduled'
  | 'published'
  | 'active'
  | 'paused'
  | 'expired'
  | 'rejected'
  | 'archived';

export interface IApprovalHistory {
  status: AdPosterStatus;
  changedBy: mongoose.Types.ObjectId;
  note?: string;
  timestamp: Date;
}

export interface IAdPoster extends Document {
  title: string;
  description: string;
  badgeText: string;
  imageUrl: string;
  targetUrl: string;
  contactAction?: string;
  category: 'Business Ad' | 'Community Poster' | 'Sponsorship' | 'Notice Poster' | 'Promotion';
  communityId?: mongoose.Types.ObjectId;
  targetCommunities: mongoose.Types.ObjectId[];
  isGlobal: boolean;
  status: AdPosterStatus;
  rejectionReason?: string;
  approvalHistory: IApprovalHistory[];
  impressions: number;
  clicks: number;
  startDate?: Date;
  endDate?: Date;
  createdBy?: mongoose.Types.ObjectId;
  approvedBy?: mongoose.Types.ObjectId;
  approvedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ApprovalHistorySchema = new Schema<IApprovalHistory>(
  {
    status: { type: String, required: true },
    changedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    note: { type: String, default: '' },
    timestamp: { type: Date, default: Date.now },
  },
  { _id: false }
);

const AdPosterSchema = new Schema<IAdPoster>(
  {
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
    communityId: { type: Schema.Types.ObjectId, ref: 'Community', index: true },
    targetCommunities: [{ type: Schema.Types.ObjectId, ref: 'Community' }],
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
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', index: true },
    approvedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    approvedAt: { type: Date },
  },
  { timestamps: true }
);

AdPosterSchema.index({ status: 1, communityId: 1, startDate: 1, endDate: 1 });

export const AdPoster = mongoose.model<IAdPoster>('AdPoster', AdPosterSchema);
