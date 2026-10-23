import mongoose, { Schema, Document } from 'mongoose';

export interface INotification extends Document {
  recipient: mongoose.Types.ObjectId;
  type: 'announcement' | 'campaign' | 'membership' | 'approval' | 'system' | 'alert' | 'complaint';
  title: string;
  body: string;
  resourceId?: string;
  resourceType?: string;
  read: boolean;
  actionUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

const NotificationSchema = new Schema<INotification>(
  {
    recipient: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: {
      type: String,
      enum: ['announcement', 'campaign', 'membership', 'approval', 'system', 'alert', 'complaint'],
      default: 'system',
    },
    title: { type: String, required: true, trim: true },
    body: { type: String, required: true, trim: true },
    resourceId: { type: String, default: '' },
    resourceType: { type: String, default: '' },
    read: { type: Boolean, default: false, index: true },
    actionUrl: { type: String, default: '' },
  },
  { timestamps: true }
);

NotificationSchema.index({ recipient: 1, read: 1, createdAt: -1 });

export const Notification = mongoose.model<INotification>('Notification', NotificationSchema);
