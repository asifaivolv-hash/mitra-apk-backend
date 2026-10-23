import mongoose, { Schema, Document } from 'mongoose';

export interface IAnalyticsEvent extends Document {
  eventType: 'ad_impression' | 'ad_click' | 'announcement_view' | 'screen_view' | 'rsvp';
  userId?: mongoose.Types.ObjectId;
  communityId?: mongoose.Types.ObjectId;
  resourceId?: string;
  metadata?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
}

const AnalyticsEventSchema = new Schema<IAnalyticsEvent>(
  {
    eventType: {
      type: String,
      enum: ['ad_impression', 'ad_click', 'announcement_view', 'screen_view', 'rsvp'],
      required: true,
      index: true,
    },
    userId: { type: Schema.Types.ObjectId, ref: 'User' },
    communityId: { type: Schema.Types.ObjectId, ref: 'Community', index: true },
    resourceId: { type: String, default: '', index: true },
    metadata: { type: Schema.Types.Mixed, default: {} },
    ipAddress: { type: String, default: '' },
    userAgent: { type: String, default: '' },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

AnalyticsEventSchema.index({ eventType: 1, resourceId: 1, createdAt: -1 });

export const AnalyticsEvent = mongoose.model<IAnalyticsEvent>('AnalyticsEvent', AnalyticsEventSchema);
