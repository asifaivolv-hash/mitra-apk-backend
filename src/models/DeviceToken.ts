import mongoose, { Schema, Document } from 'mongoose';

export interface IDeviceToken extends Document {
  userId: mongoose.Types.ObjectId;
  token: string;
  platform: 'android' | 'ios' | 'web';
  deviceModel?: string;
  lastActive: Date;
  createdAt: Date;
  updatedAt: Date;
}

const DeviceTokenSchema = new Schema<IDeviceToken>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    token: { type: String, required: true, unique: true, trim: true },
    platform: { type: String, enum: ['android', 'ios', 'web'], default: 'android' },
    deviceModel: { type: String, default: '' },
    lastActive: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export const DeviceToken = mongoose.model<IDeviceToken>('DeviceToken', DeviceTokenSchema);
