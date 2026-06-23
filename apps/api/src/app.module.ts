import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerModule } from '@nestjs/throttler';

// Core
import { PrismaModule } from './prisma/prisma.module';
import { SmsModule } from './sms/sms.module';
import { HealthModule } from './health/health.module';

// Domain modules (brief Phase B)
import { AuthModule } from './auth/auth.module';       //  Module 2
import { UsersModule } from './users/users.module';    //  Module 3
import { CitiesModule } from './cities/cities.module'; //  Module 3
import { CatalogModule } from './catalog/catalog.module';                   //  Module 4
import { VendorProductsModule } from './vendor-products/vendor-products.module'; //  Module 4
import { SearchModule } from './search/search.module';                      //  Module 5
import { InstallmentsModule } from './installments/installments.module';    //  Module 6
import { CartModule } from './cart/cart.module';                            //  Module 7
import { OrdersModule } from './orders/orders.module';                      //  Module 7
import { VendorModule } from './vendor/vendor.module';                      //  Module 8
import { PaymentsModule } from './payments/payments.module';                //  Module 9
import { NotificationsModule } from './notifications/notifications.module'; //  Module 10
import { AdminModule } from './admin/admin.module';                         //  Module 11
import { SeoModule } from './seo/seo.module';                               //  Module 11
import { BannersModule } from './banners/banners.module';                   //  Homepage banners
import { BlogModule } from './blog/blog.module';                            //  Blog / content SEO

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, cache: true }),
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 100 }]),
    ScheduleModule.forRoot(), // enables @Cron() decorators

    PrismaModule,
    SmsModule,
    HealthModule,

    AuthModule,
    UsersModule,
    CitiesModule,
    CatalogModule,
    VendorProductsModule,
    SearchModule,
    InstallmentsModule,
    CartModule,
    OrdersModule,
    VendorModule,
    PaymentsModule,
    NotificationsModule,
    AdminModule,
    SeoModule,
    BannersModule,
    BlogModule,
  ],
})
export class AppModule {}
