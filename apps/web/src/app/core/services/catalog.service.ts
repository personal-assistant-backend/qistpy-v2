import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import {
  Brand,
  Category,
  Paginated,
  ProductDetail,
  ProductListItem,
} from '../models/api.models';

export interface ProductListFilters {
  categorySlug?: string;
  brandSlug?: string;
  q?: string;
  minPrice?: number;
  maxPrice?: number;
  sort?: 'latest' | 'price_asc' | 'price_desc' | 'name_asc';
  page?: number;
  pageSize?: number;
}

@Injectable({ providedIn: 'root' })
export class CatalogService {
  private readonly http = inject(HttpClient);

  listCategories(): Observable<Category[]> {
    return this.http.get<Category[]>('/categories');
  }

  getCategory(slug: string): Observable<Category> {
    return this.http.get<Category>(`/categories/${slug}`);
  }

  listBrands(): Observable<Brand[]> {
    return this.http.get<Brand[]>('/brands');
  }

  listProducts(filters: ProductListFilters = {}): Observable<Paginated<ProductListItem>> {
    let params = new HttpParams();
    for (const [key, value] of Object.entries(filters)) {
      if (value !== undefined && value !== null && value !== '') {
        params = params.set(key, String(value));
      }
    }
    return this.http.get<Paginated<ProductListItem>>('/products', { params });
  }

  getProduct(slug: string): Observable<ProductDetail> {
    return this.http.get<ProductDetail>(`/products/${slug}`);
  }
}
