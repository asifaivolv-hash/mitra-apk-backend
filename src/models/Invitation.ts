import mongoose, { Schema, Document } from 'mongoose';

export interface IInvitation extends Document {
  communityId: mongoose.Types.ObjectId;
  invitedBy: mongoose.Types.ObjectId;
  email?: string;
  phone?: string;
  code: string;
  role: 'member' | 'resident' | 'community_manager' | 'committee';
  unit?: {
    block: string;
    flat: string;
  };
  status: 'pending' | 'accepted' | 'expired' | 'revoked';
  expiresAt: Date;
  acceptedAt?: Date;
  acceptedBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const InvitationSchema = new Schema<IInvitation>(
  {
    communityId: { type: Schema.Types.ObjectId, ref: 'Community', required: true, index: true },
    invitedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    email: { type: String, lowercase: true, trim: true },
    phone: { type: String, trim: true },
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    role: {
      type: String,
      enum: ['member', 'resident', 'community_manager', 'committee'],
      default: 'member',
    },
    unit: {
      block: { type: String, default: 'Block A' },
      flat: { type: String, default: '101' },
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'expired', 'revoked'],
      default: 'pending',
      index: true,
    },
    expiresAt: { type: Date, required: true },
    acceptedAt: { type: Date },
    acceptedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

export const Invitation = mongoose.model<IInvitation>('Invitation', InvitationSchema);
