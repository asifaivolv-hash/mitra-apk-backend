import mongoose, { Schema, Document } from 'mongoose';

export interface IListing extends Document {
  title: string;
  type: 'Buy' | 'Services';
  category: 'Furniture' | 'Home Appliances' | 'Local Services' | 'Used Items';
  price: string;
  condition: string;
  location: string;
  sellerId: mongoose.Types.ObjectId;
  sellerName: string;
  contactType: 'proxy_call' | 'in_app_chat';
  image: string;
  verified: boolean;
  status: 'active' | 'sold' | 'removed';
  createdAt: Date;
  updatedAt: Date;
}

const ListingSchema = new Schema<IListing>(
  {
    title: { type: String, required: true, trim: true },
    type: { type: String, enum: ['Buy', 'Services'], default: 'Buy' },
    category: {
      type: String,
      enum: ['Furniture', 'Home Appliances', 'Local Services', 'Used Items'],
      default: 'Furniture',
    },
    price: { type: String, required: true },
    condition: { type: String, default: 'Good Condition' },
    location: { type: String, required: true },
    sellerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    sellerName: { type: String, required: true },
    contactType: {
      type: String,
      enum: ['proxy_call', 'in_app_chat'],
      default: 'proxy_call',
    },
    image: { type: String, default: '' },
    verified: { type: Boolean, default: true },
    status: {
      type: String,
      enum: ['active', 'sold', 'removed'],
      default: 'active',
    },
  },
  { timestamps: true }
);

export const Listing = mongoose.model<IListing>('Listing', ListingSchema);
