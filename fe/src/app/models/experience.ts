export type ExperienceCategory = 'Tất cả' | 'Kỹ thuật bó hoa' | 'Chăm hoa tại nhà' | 'Atelier FLEURÉ';

export interface ExperienceVideo {
  id: number;
  title: string;
  slug: string;
  subtitle: string;
  category: Exclude<ExperienceCategory, 'Tất cả'>;
  duration: string;
  views: number;
  posterImage: string;
  videoUrl: string;
  steps: string[];
  linkedProductId: number;
  publishedAt: string;
}
