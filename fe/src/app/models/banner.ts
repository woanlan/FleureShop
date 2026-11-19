import { Category } from './category';
import { Post } from './post';
import { Product } from './product';

export interface Banner {
  id: number;
  slug: string;
  badge: string;
  title: string;
  subtitle: string;
  ctaLabel: string;
  ctaRoute: string;
  image: string;
  order: number;
  isActive: boolean;
}

export interface HomePayload {
  banners: Banner[];
  categories: Category[];
  newProducts: Product[];
  bestSellingProducts: Product[];
  saleProducts: Product[];
  latestPosts: Post[];
}
