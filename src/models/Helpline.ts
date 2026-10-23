import mongoose, { Schema, Document } from 'mongoose';

export interface IHelpline extends Document {
  title: string;
  subtitle: string;
  extension: string;
  phoneNumber: string;
  category: 'security' | 'maintenance' | 'emergency' | 'admin';
  tag: string;
  tagColor: string;
  callButtonColor: string;
  priority: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const HelplineSchema = new Schema<IHelpline>(
  {
    title: { type: String, required: true },
    subtitle: { type: String, required: true },
    extension: { type: String, default: '' },
    phoneNumber: { type: String, required: true },
    category: {
      type: String,
      enum: ['security', 'maintenance', 'emergency', 'admin'],
      default: 'emergency',
    },
    tag: { type: String, default: 'Quick Dial' },
    tagColor: { type: String, default: 'bg-blue-50 text-[#060E57]' },
    callButtonColor: { type: String, default: 'bg-[#060E57] hover:bg-[#1684F3]' },
    priority: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const Helpline = mongoose.model<IHelpline>('Helpline', HelplineSchema);
