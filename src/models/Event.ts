import mongoose, { Schema, Document } from 'mongoose';

export interface IEvent extends Document {
  title: string;
  type: 'Festival Celebration' | 'Sports Event' | 'Residents Meeting' | 'Kids Activity';
  category: 'Celebration' | 'Sports' | 'Meeting' | 'Kids';
  date: string;
  time: string;
  location: string;
  description: string;
  image: string;
  maxSlots: number;
  rsvps: mongoose.Types.ObjectId[];
  communityId?: mongoose.Types.ObjectId;
  createdBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const EventSchema = new Schema<IEvent>(
  {
    title: { type: String, required: true, trim: true },
    type: {
      type: String,
      enum: ['Festival Celebration', 'Sports Event', 'Residents Meeting', 'Kids Activity'],
      default: 'Festival Celebration',
    },
    category: {
      type: String,
      enum: ['Celebration', 'Sports', 'Meeting', 'Kids'],
      default: 'Celebration',
    },
    date: { type: String, required: true },
    time: { type: String, required: true },
    location: { type: String, required: true },
    description: { type: String, default: '' },
    image: { type: String, default: '' },
    maxSlots: { type: Number, default: 100 },
    rsvps: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    communityId: { type: Schema.Types.ObjectId, ref: 'Community' },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

export const Event = mongoose.model<IEvent>('Event', EventSchema);
