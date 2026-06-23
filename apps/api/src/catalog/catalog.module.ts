import { Module } from '@nestjs/common';
import { AdminBrandsController } from './brands/admin-brands.controller';
import { BrandsController } from './brands/brands.controller';
import { BrandsService } from './brands/brands.service';
import { AdminCategoriesController } from './categories/admin-categories.controller';
import { CategoriesController } from './categories/categories.controller';
import { CategoriesService } from './categories/categories.service';
import { ProductsController } from './products/products.controller';
import { ProductsService } from './products/products.service';

/**
 * Bundles all public catalog read routes (/categories, /brands, /products)
 * and admin CRUD routes (/admin/categories, /admin/brands).
 * Vendor-side product management lives in VendorProductsModule.
 */
@Module({
  controllers: [
    // Public
    CategoriesController,
    BrandsController,
    ProductsController,
    // Admin
    AdminCategoriesController,
    AdminBrandsController,
  ],
  providers: [CategoriesService, BrandsService, ProductsService],
  exports: [CategoriesService, BrandsService, ProductsService],
})
export class CatalogModule {}
