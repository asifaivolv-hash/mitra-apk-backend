import mongoose, { Schema, Document } from 'mongoose';

export interface IComplaint extends Document {
  referenceNo: string;
  title: string;
  description: string;
  category: 'Maintenance' | 'Electrical' | 'Plumbing' | 'Security' | 'Noise' | 'Common Area' | 'Sanitation' | 'Other';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'in_progress' | 'resolved' | 'rejected';
  communityId?: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  userName: string;
  userPhone: string;
  unit: {
    block: string;
    flat: string;
  };
  assignedTo?: string;
  resolutionNotes?: string;
  resolvedAt?: Date;
  images?: string[];
  createdAt: Date;
  updatedAt: Date;
}

const ComplaintSchema = new Schema<IComplaint>(
  {
    referenceNo: { type: String, unique: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    category: {
      type: String,
      enum: ['Maintenance', 'Electrical', 'Plumbing', 'Security', 'Noise', 'Common Area', 'Sanitation', 'Other'],
      default: 'Maintenance',
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'urgent'],
      default: 'medium',
    },
    status: {
      type: String,
      enum: ['pending', 'in_progress', 'resolved', 'rejected'],
      default: 'pending',
    },
    communityId: { type: Schema.Types.ObjectId, ref: 'Community' },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    userName: { type: String, required: true },
    userPhone: { type: String, required: true },
    unit: {
      block: { type: String, default: 'Block A' },
      flat: { type: String, required: true },
    },
    assignedTo: { type: String, default: 'Unassigned' },
    resolutionNotes: { type: String, default: '' },
    resolvedAt: { type: Date },
    images: [{ type: String }],
  },
  { timestamps: true }
);

ComplaintSchema.pre('validate', function (next) {
  if (!this.referenceNo) {
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    this.referenceNo = `CMP-${new Date().getFullYear()}-${randomSuffix}`;
  }
  next();
});

export const Complaint = mongoose.model<IComplaint>('Complaint', ComplaintSchema);
