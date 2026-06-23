import { Routes } from '@angular/router';
import { authGuard, roleGuard } from './core/guards/auth.guard';

/**
 * All routes use lazy loading (brief Phase 9 performance rule).
 * Static pages share one component, passing @Input page key via route data
 * (componentInputBinding is enabled in app.config.ts).
 */
export const routes: Routes = [
  // ---------- Public marketing ----------
  {
    path: '',
    loadComponent: () =>
      import('./features/home/home.component').then((m) => m.HomeComponent),
    title: 'Easy Installment Plan in Pakistan — QistPY',
  },
  {
    path: 'shop',
    loadComponent: () =>
      import('./features/products/products-list.component').then((m) => m.ProductsListComponent),
    title: 'Shop on Installments — QistPY',
  },
  {
    path: 'brand/:brandSlug',
    loadComponent: () =>
      import('./features/products/brand-page.component').then((m) => m.BrandPageComponent),
    title: 'Brand — QistPY',
  },
  {
    path: 'shop/:categorySlug',
    loadComponent: () =>
      import('./features/products/products-list.component').then((m) => m.ProductsListComponent),
  },
  {
    path: 'product/:slug',
    loadComponent: () =>
      import('./features/products/product-detail.component').then((m) => m.ProductDetailComponent),
  },

  // ---------- Auth ----------
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login.component').then((m) => m.LoginComponent),
    title: 'Login — QistPY',
  },
  {
    path: 'signup',
    loadComponent: () => import('./features/auth/signup.component').then((m) => m.SignupComponent),
    title: 'Sign Up — QistPY',
  },
  {
    path: 'forgot-password',
    loadComponent: () =>
      import('./features/auth/forgot-password.component').then((m) => m.ForgotPasswordComponent),
    title: 'Reset Password — QistPY',
  },

  // ---------- Cart (public; checkout is guarded) ----------
  {
    path: 'cart',
    loadComponent: () => import('./features/cart/cart.component').then((m) => m.CartComponent),
    canActivate: [authGuard],
    title: 'Your Cart — QistPY',
  },
  {
    path: 'checkout',
    loadComponent: () =>
      import('./features/cart/checkout.component').then((m) => m.CheckoutComponent),
    canActivate: [authGuard],
    title: 'Checkout — QistPY',
  },

  // ---------- Customer Account ----------
  {
    path: 'account',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/account/account-shell.component').then((m) => m.AccountShellComponent),
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./features/account/account-overview.component').then(
            (m) => m.AccountOverviewComponent,
          ),
        title: 'My Account — QistPY',
      },
      {
        path: 'orders',
        loadComponent: () =>
          import('./features/account/account-orders.component').then((m) => m.AccountOrdersComponent),
        title: 'My Orders — QistPY',
      },
      {
        path: 'orders/:id',
        loadComponent: () =>
          import('./features/account/account-orders.component').then(
            (m) => m.AccountOrderDetailComponent,
          ),
      },
      {
        path: 'installments',
        loadComponent: () =>
          import('./features/account/account-installments.component').then(
            (m) => m.AccountInstallmentsComponent,
          ),
        title: 'My Installments — QistPY',
      },
      {
        path: 'installments/:id',
        loadComponent: () =>
          import('./features/account/account-installments.component').then(
            (m) => m.AccountInstallmentsComponent,
          ),
      },
      {
        path: 'addresses',
        loadComponent: () =>
          import('./features/account/account-addresses.component').then(
            (m) => m.AccountAddressesComponent,
          ),
        title: 'My Addresses — QistPY',
      },
      {
        path: 'profile',
        loadComponent: () =>
          import('./features/account/account-profile.component').then(
            (m) => m.AccountProfileComponent,
          ),
        title: 'Profile & Settings — QistPY',
      },
      {
        path: 'notifications',
        loadComponent: () =>
          import('./features/account/account-profile.component').then(
            (m) => m.AccountNotificationsComponent,
          ),
        title: 'Notifications — QistPY',
      },
    ],
  },

  // ---------- Vendor ----------
  {
    path: 'vendor',
    canActivate: [roleGuard(['VENDOR', 'ADMIN'])],
    loadComponent: () =>
      import('./features/vendor/vendor-dashboard.component').then(
        (m) => m.VendorDashboardComponent,
      ),
    title: 'Vendor Dashboard — QistPY',
  },

  // ---------- Admin ----------
  {
    path: 'admin',
    canActivate: [roleGuard(['ADMIN'])],
    loadComponent: () =>
      import('./features/admin/admin-dashboard.component').then((m) => m.AdminDashboardComponent),
    title: 'Admin Panel — QistPY',
  },

  // ---------- Static pages (one component, route data drives which view) ----------
  {
    path: 'how-it-works',
    loadComponent: () =>
      import('./features/static/static-page.component').then((m) => m.StaticPageComponent),
    data: { page: 'how-it-works' },
    title: 'How It Works — QistPY',
  },
  {
    path: 'about',
    loadComponent: () =>
      import('./features/static/static-page.component').then((m) => m.StaticPageComponent),
    data: { page: 'about' },
    title: 'About Us — QistPY',
  },
  {
    path: 'contact',
    loadComponent: () =>
      import('./features/static/static-page.component').then((m) => m.StaticPageComponent),
    data: { page: 'contact' },
    title: 'Contact — QistPY',
  },
  {
    path: 'faqs',
    loadComponent: () =>
      import('./features/static/static-page.component').then((m) => m.StaticPageComponent),
    data: { page: 'faqs' },
    title: 'FAQs — QistPY',
  },
  {
    path: 'terms',
    loadComponent: () =>
      import('./features/static/static-page.component').then((m) => m.StaticPageComponent),
    data: { page: 'terms' },
    title: 'Terms of Service — QistPY',
  },
  {
    path: 'privacy',
    loadComponent: () =>
      import('./features/static/static-page.component').then((m) => m.StaticPageComponent),
    data: { page: 'privacy' },
    title: 'Privacy Policy — QistPY',
  },

  // ---------- Blog ----------
  {
    path: 'blog',
    loadComponent: () =>
      import('./features/blog/blog-list.component').then((m) => m.BlogListComponent),
  },
  {
    path: 'blog/:slug',
    loadComponent: () =>
      import('./features/blog/blog-detail.component').then((m) => m.BlogDetailComponent),
  },

  {
    path: '**',
    loadComponent: () =>
      import('./features/static/seo-landing.component').then((m) => m.SeoLandingComponent),
  },
];
