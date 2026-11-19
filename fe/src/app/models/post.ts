export type PostCategory =
  | 'Tất cả'
  | 'Chăm sóc hoa'
  | 'Ý nghĩa hoa'
  | 'Nghệ thuật gói'
  | 'Xu hướng';

export interface Post {
  id: number;
  title: string;
  slug: string;
  excerpt: string;
  content: string[];
  careTip: string;
  image: string;
  category: Exclude<PostCategory, 'Tất cả'>;
  author: string;
  publishedAt: string;
  readTimeMinutes: number;
  relatedProductId: number;
}
