import mongoose, { Schema, Document } from 'mongoose';

export type NoticeStatus = 'draft' | 'scheduled' | 'published' | 'archived';

export interface INotice extends Document {
  title: string;
  content: string;
  category: 'Colony Announcement' | 'Community Notice' | 'Maintenance Update' | 'Upcoming Activity' | 'Security Advisory' | 'Official Circular';
  priority: 'normal' | 'urgent' | 'critical';
  author: string;
  image?: string;
  communityId?: mongoose.Types.ObjectId;
  targetCommunities?: mongoose.Types.ObjectId[];
  isPinned: boolean;
  status: NoticeStatus;
  scheduledFor?: Date;
  publishedAt: Date;
  readBy: mongoose.Types.ObjectId[];
  createdBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const NoticeSchema = new Schema<INotice>(
  {
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
    communityId: { type: Schema.Types.ObjectId, ref: 'Community', index: true },
    targetCommunities: [{ type: Schema.Types.ObjectId, ref: 'Community' }],
    isPinned: { type: Boolean, default: false },
    status: {
      type: String,
      enum: ['draft', 'scheduled', 'published', 'archived'],
      default: 'published',
      index: true,
    },
    scheduledFor: { type: Date },
    publishedAt: { type: Date, default: Date.now },
    readBy: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

NoticeSchema.index({ status: 1, communityId: 1, publishedAt: -1 });

export const Notice = mongoose.model<INotice>('Notice', NoticeSchema);
export const Announcement = Notice; // Alias to support Announcement naming seamlessly
