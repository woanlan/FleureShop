import mongoose from 'mongoose';

const experienceSchema = new mongoose.Schema(
  {
    id: { type: Number, required: true, unique: true, index: true },
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, index: true, trim: true },
    subtitle: { type: String, required: true },
    category: {
      type: String,
      required: true,
      enum: ['Kỹ thuật bó hoa', 'Chăm hoa tại nhà', 'Atelier FLEURÉ'],
    },
    duration: { type: String, required: true },
    views: { type: Number, default: 0, min: 0 },
    posterImage: { type: String, required: true },
    videoUrl: { type: String, required: true },
    steps: { type: [String], required: true },
    linkedProductId: { type: Number, required: true },
    publishedAt: { type: String, required: true },
  },
  {
    versionKey: false,
  }
);

export const ExperienceModel = mongoose.model('Experience', experienceSchema);
