import mongoose from 'mongoose';

const postSchema = new mongoose.Schema(
  {
    id: { type: Number, required: true, unique: true, index: true },
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, index: true, trim: true },
    excerpt: { type: String, required: true },
    content: { type: [String], required: true },
    careTip: { type: String, required: true },
    image: { type: String, required: true },
    category: {
      type: String,
      required: true,
      enum: ['Chăm sóc hoa', 'Ý nghĩa hoa', 'Nghệ thuật gói', 'Xu hướng'],
    },
    author: { type: String, required: true },
    publishedAt: { type: String, required: true },
    readTimeMinutes: { type: Number, required: true, min: 1 },
    relatedProductId: { type: Number, required: true },
  },
  {
    versionKey: false,
  }
);

export const PostModel = mongoose.model('Post', postSchema);
