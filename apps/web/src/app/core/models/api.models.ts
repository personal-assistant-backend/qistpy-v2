/**
 * Shared API response shapes. Kept simple and hand-maintained since we don't
 * have a code-gen step yet. Fields match the backend DTOs.
 */

export interface BlogCategory {
  id: string;
  name: string;
  slug: string;
}

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  coverImageUrl?: string | null;
  category?: BlogCategory | null;
  language: string;
  isPublished: boolean;
  publishedAt?: string | null;
  metaTitle?: string | null;
  metaDescription?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PaginationMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface Paginated<T> {
  data: T[];
  meta: PaginationMeta;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  imageUrl?: string | null;
  iconUrl?: string | null;
  children?: Array<Pick<Category, 'id' | 'name' | 'slug' | 'imageUrl' | 'iconUrl'>>;
}

export interface Brand {
  id: string;
  name: string;
  slug: string;
  logoUrl?: string | null;
}

export interface City {
  id: string;
  name: string;
  slug: string;
}

export interface ProductImage {
  url: string;
  alt?: string | null;
}

export interface ProductListItem {
  id: string;
  name: string;
  slug: string;
  shortDescription?: string | null;
  cashPrice: string; // Decimal-over-wire is string
  lowestAdvance: string | null;
  lowestMonthly: string | null;
  stock: number;
  category: { id: string; name: string; slug: string };
  brand: { id: string; name: string; slug: string } | null;
  images: ProductImage[];
}

export interface InstallmentPlan {
  id: string;
  durationMonths: number;
  advanceAmount: string;
  monthlyAmount: string;
  markupPercentage: string;
  markupAmount: string;
  totalPayable: string;
  isActive: boolean;
}

export interface ProductSpec {
  id: string;
  label: string;
  value: string;
  orderIndex: number;
}

export interface ProductDetail extends Omit<ProductListItem, 'images'> {
  description: string;
  images: Array<ProductImage & { id: string; isPrimary: boolean; orderIndex: number }>;
  specs: ProductSpec[];
  plans: InstallmentPlan[];
  vendor: { id: string; businessName: string; slug: string; logoUrl: string | null };
}
