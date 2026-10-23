import mongoose, { Schema, Document } from 'mongoose';

export interface ISocietySetting extends Document {
  societyName: string;
  tagline: string;
  address: string;
  city: string;
  totalFlats: number;
  adBanner: {
    enabled: boolean;
    badgeText: string;
    title: string;
    subtitle: string;
    ctaText: string;
    targetUrl: string;
  };
  contactEmail: string;
  contactPhone: string;
  updatedAt: Date;
}

const SocietySettingSchema = new Schema<ISocietySetting>(
  {
    societyName: { type: String, default: 'Greenwood Heights Society' },
    tagline: { type: String, default: 'Stronger Together' },
    address: { type: String, default: 'Financial District, Nanakramguda' },
    city: { type: String, default: 'Hyderabad' },
    totalFlats: { type: Number, default: 520 },
    adBanner: {
      enabled: { type: Boolean, default: true },
      badgeText: { type: String, default: 'YOUR AD HERE' },
      title: { type: String, default: 'Reach 500+ Families in your Community' },
      subtitle: { type: String, default: 'Promote local businesses and services directly to verified neighbours.' },
      ctaText: { type: String, default: 'Post Ad Now' },
      targetUrl: { type: String, default: '/classifieds' },
    },
    contactEmail: { type: String, default: 'office@greenwoodheights.org' },
    contactPhone: { type: String, default: '+91 40 2345 6789' },
  },
  { timestamps: true }
);

export const SocietySetting = mongoose.model<ISocietySetting>('SocietySetting', SocietySettingSchema);
