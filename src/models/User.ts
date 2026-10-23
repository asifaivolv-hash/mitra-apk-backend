import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcryptjs';

export type UserRole =
  | 'member'
  | 'resident'
  | 'community_manager'
  | 'manager'
  | 'committee'
  | 'admin'
  | 'central_admin'
  | 'superadmin';

export interface IUser extends Document {
  name: string;
  email: string;
  phone: string;
  passwordHash: string;
  unit: {
    block: string;
    flat: string;
  };
  role: UserRole;
  status: 'active' | 'pending_approval' | 'suspended' | 'deactivated';
  communityId?: mongoose.Types.ObjectId;
  assignedCommunities?: mongoose.Types.ObjectId[];
  designation?: string;
  managedBy?: mongoose.Types.ObjectId;
  privacy: {
    hidePhone: boolean;
    allowProxyCalls: boolean;
  };
  avatar?: string;
  fcmToken?: string;
  notificationPreferences?: {
    announcements: boolean;
    campaigns: boolean;
    events: boolean;
    discussions: boolean;
  };
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const UserSchema = new Schema<IUser>(
  {
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
    communityId: { type: Schema.Types.ObjectId, ref: 'Community', index: true },
    assignedCommunities: [{ type: Schema.Types.ObjectId, ref: 'Community' }],
    designation: { type: String, default: '' },
    managedBy: { type: Schema.Types.ObjectId, ref: 'User' },
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
  },
  { timestamps: true }
);

// Method to verify password
UserSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.passwordHash);
};

export const User = mongoose.model<IUser>('User', UserSchema);
