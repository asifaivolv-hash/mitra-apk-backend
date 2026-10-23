import mongoose, { Schema, Document } from 'mongoose';

export interface ICommunityMembership extends Document {
  userId: mongoose.Types.ObjectId;
  communityId: mongoose.Types.ObjectId;
  status: 'active' | 'pending' | 'rejected' | 'suspended';
  role: 'member' | 'resident' | 'committee' | 'manager';
  unit: {
    block: string;
    flat: string;
  };
  approvedBy?: mongoose.Types.ObjectId;
  requestedAt: Date;
  approvedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const CommunityMembershipSchema = new Schema<ICommunityMembership>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    communityId: { type: Schema.Types.ObjectId, ref: 'Community', required: true, index: true },
    status: {
      type: String,
      enum: ['active', 'pending', 'rejected', 'suspended'],
      default: 'pending',
      index: true,
    },
    role: {
      type: String,
      enum: ['member', 'resident', 'committee', 'manager'],
      default: 'member',
    },
    unit: {
      block: { type: String, default: 'Block A' },
      flat: { type: String, required: true },
    },
    approvedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    requestedAt: { type: Date, default: Date.now },
    approvedAt: { type: Date },
  },
  { timestamps: true }
);

// Prevent duplicate memberships using compound unique index
CommunityMembershipSchema.index({ userId: 1, communityId: 1 }, { unique: true });

export const CommunityMembership = mongoose.model<ICommunityMembership>('CommunityMembership', CommunityMembershipSchema);
