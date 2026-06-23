import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { BlogCategory, BlogPost, Paginated } from '../models/api.models';

@Injectable({ providedIn: 'root' })
export class BlogService {
  private readonly http = inject(HttpClient);

  list(page = 1, pageSize = 9): Observable<Paginated<BlogPost>> {
    return this.http.get<Paginated<BlogPost>>(`/blog?page=${page}&pageSize=${pageSize}`);
  }

  getBySlug(slug: string): Observable<BlogPost & { related: BlogPost[] }> {
    return this.http.get<BlogPost & { related: BlogPost[] }>(`/blog/${slug}`);
  }

  listCategories(): Observable<BlogCategory[]> {
    return this.http.get<BlogCategory[]>('/blog/categories');
  }
}
