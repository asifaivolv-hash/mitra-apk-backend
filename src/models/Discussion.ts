import mongoose, { Schema, Document } from 'mongoose';

export interface IComment {
  _id?: mongoose.Types.ObjectId;
  authorId: mongoose.Types.ObjectId;
  authorName: string;
  unit: string;
  content: string;
  createdAt: Date;
}

export interface IDiscussion extends Document {
  authorId: mongoose.Types.ObjectId;
  authorName: string;
  unit: string;
  title: string;
  content: string;
  tag: 'Water & Utilities' | 'Sports & Fitness' | 'Lost & Found' | 'Security & Safety' | 'General Ideas';
  likes: mongoose.Types.ObjectId[];
  comments: IComment[];
  createdAt: Date;
  updatedAt: Date;
}

const CommentSchema = new Schema<IComment>({
  authorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  authorName: { type: String, required: true },
  unit: { type: String, required: true },
  content: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

const DiscussionSchema = new Schema<IDiscussion>(
  {
    authorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    authorName: { type: String, required: true },
    unit: { type: String, required: true },
    title: { type: String, required: true, trim: true },
    content: { type: String, required: true },
    tag: {
      type: String,
      enum: ['Water & Utilities', 'Sports & Fitness', 'Lost & Found', 'Security & Safety', 'General Ideas'],
      default: 'General Ideas',
    },
    likes: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    comments: [CommentSchema],
  },
  { timestamps: true }
);

export const Discussion = mongoose.model<IDiscussion>('Discussion', DiscussionSchema);
