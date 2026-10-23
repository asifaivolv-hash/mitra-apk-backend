import mongoose, { Schema, Document } from 'mongoose';

export interface ICommitteeMember extends Document {
  role: 'President' | 'General Secretary' | 'Treasurer' | 'Facility Lead' | 'Cultural Lead' | 'Eco Lead';
  name: string;
  unit: string;
  tenure: string;
  focus: string;
  phoneNumber: string;
  email: string;
  initials: string;
  avatarBg: string;
  badgeColor: string;
  displayOrder: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const CommitteeMemberSchema = new Schema<ICommitteeMember>(
  {
    role: {
      type: String,
      enum: ['President', 'General Secretary', 'Treasurer', 'Facility Lead', 'Cultural Lead', 'Eco Lead'],
      required: true,
    },
    name: { type: String, required: true },
    unit: { type: String, required: true },
    tenure: { type: String, default: 'Tenure: 2025 – 2027' },
    focus: { type: String, required: true },
    phoneNumber: { type: String, default: '+91 98765 00000' },
    email: { type: String, default: 'committee@greenwoodheights.org' },
    initials: { type: String, default: 'MC' },
    avatarBg: { type: String, default: 'bg-[#060E57]' },
    badgeColor: { type: String, default: 'bg-blue-100 text-[#060E57]' },
    displayOrder: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const CommitteeMember = mongoose.model<ICommitteeMember>('CommitteeMember', CommitteeMemberSchema);
