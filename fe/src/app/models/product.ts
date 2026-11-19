export type ProductCategory =
  | 'Tất cả'
  | 'Hoa sinh nhật'
  | 'Hoa tình yêu'
  | 'Hoa chúc mừng'
  | 'Hoa cưới'
  | 'Lan hồ điệp';

export interface Product {
  id: number;
  name: string;
  slug: string;
  categoryId: number;
  category: Exclude<ProductCategory, 'Tất cả'>;
  categorySlug: string;
  price: string;
  oldPrice: string;
  priceValue: number;
  oldPriceValue: number;
  image: string;
  description: string;
  meaning: string;
  discount: number;
  sold: number;
  createdAt: string;
  badge?: string;
  badgeClass?: string;
}
