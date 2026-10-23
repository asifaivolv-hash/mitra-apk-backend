import mongoose, { Schema, Document } from 'mongoose';

export interface ICommunity extends Document {
  name: string;
  code: string;
  slug?: string;
  description?: string;
  city: string;
  address: string;
  totalUnits: number;
  adminId?: mongoose.Types.ObjectId;
  assignedManagers: mongoose.Types.ObjectId[];
  createdBy?: mongoose.Types.ObjectId;
  logo?: string;
  bannerImage?: string;
  status: 'active' | 'inactive' | 'pending';
  createdAt: Date;
  updatedAt: Date;
}

const CommunitySchema = new Schema<ICommunity>(
  {
    name: { type: String, required: true, trim: true },
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    slug: { type: String, lowercase: true, trim: true },
    description: { type: String, default: 'Modern residential apartment & villa community.' },
    city: { type: String, required: true, trim: true },
    address: { type: String, required: true, trim: true },
    totalUnits: { type: Number, default: 100 },
    adminId: { type: Schema.Types.ObjectId, ref: 'User' },
    assignedManagers: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
    logo: { type: String, default: '' },
    bannerImage: { type: String, default: '' },
    status: { type: String, enum: ['active', 'inactive', 'pending'], default: 'active', index: true },
  },
  { timestamps: true }
);

export const Community = mongoose.model<ICommunity>('Community', CommunitySchema);
