# QistPY — API Testing Guide

All 80+ endpoints across 11 backend modules. Use **Thunder Client** or Postman.

**Base URL:** `http://localhost:3000/api`

**Test accounts (from seed):**
- Admin: `+923000000001` / `ChangeMe_123!`
- Vendor: `+923001112233` / `VendorTest123`
- Customer: `+923001234567` / `TestUser123` (or your own signup)

---

## 🔐 Authentication Flow

### 1. Login as Customer
```
POST /api/auth/login
Content-Type: application/json

{
  "phone": "+923001234567",
  "password": "TestUser123"
}
```
**Save the `accessToken` from response** — use it in `Authorization: Bearer {token}` header.

---

## 📦 Module 5: Search

### Global Search
```
GET /api/search?q=samsung&page=1&pageSize=10
```
- `q` minimum 2 chars
- Returns paginated products matching name/description

---

## 💰 Module 6: Installments

### Customer — List My Requests
```
GET /api/account/installments
Authorization: Bearer {customerToken}
```

### Customer — Get Request Details
```
GET /api/account/installments/{requestId}
Authorization: Bearer {customerToken}
```

### Customer — Cancel Request (only before advance paid)
```
POST /api/account/installments/{requestId}/cancel
Authorization: Bearer {customerToken}

{ "note": "Changed my mind" }
```

### Vendor — List Pending Requests for My Products
```
GET /api/vendor/installment-requests
Authorization: Bearer {vendorToken}
```

### Vendor — Approve Request
```
POST /api/vendor/installment-requests/{requestId}/approve
Authorization: Bearer {vendorToken}
```
✅ This auto-generates **schedule rows** (Prisma InstallmentSchedule).

### Vendor — Reject Request
```
POST /api/vendor/installment-requests/{requestId}/reject
Authorization: Bearer {vendorToken}

{ "reason": "Out of stock" }
```

### Admin — All Requests
```
GET /api/admin/installment-requests?status=PENDING
Authorization: Bearer {adminToken}
```

### Admin — Mark Defaulted (after 60+ days)
```
POST /api/admin/installment-requests/{requestId}/mark-defaulted
Authorization: Bearer {adminToken}
```

---

## 🛒 Module 7: Cart + Orders

### Get My Cart
```
GET /api/cart
Authorization: Bearer {customerToken}
```

### Add to Cart
```
POST /api/cart/items
Authorization: Bearer {customerToken}

{
  "productId": "cmo722rtc0088r9q05so7nexi",
  "installmentPlanId": "{planId-from-product-detail}",
  "quantity": 1
}
```

### Update Cart Item
```
PATCH /api/cart/items/{itemId}
Authorization: Bearer {customerToken}

{ "quantity": 2 }
```

### Remove Item
```
DELETE /api/cart/items/{itemId}
Authorization: Bearer {customerToken}
```

### Clear Cart
```
DELETE /api/cart
Authorization: Bearer {customerToken}
```

### Checkout
```
POST /api/account/orders/checkout
Authorization: Bearer {customerToken}

{
  "addressId": "{your-address-id}",
  "notes": "Deliver before 5pm"
}
```
✅ Creates Order + OrderItems + InstallmentRequests (one per item).

### List My Orders
```
GET /api/account/orders
Authorization: Bearer {customerToken}
```

### Order Detail
```
GET /api/account/orders/{orderId}
Authorization: Bearer {customerToken}
```

---

## 🏪 Module 8: Vendor + Wallet + Payouts

### Vendor Dashboard
```
GET /api/vendor
Authorization: Bearer {vendorToken}
```
Returns counts + wallet balances.

### My Wallet
```
GET /api/vendor/wallet
Authorization: Bearer {vendorToken}
```

### Transactions History
```
GET /api/vendor/wallet/transactions
Authorization: Bearer {vendorToken}
```

### List My Payout Requests
```
GET /api/vendor/payouts
Authorization: Bearer {vendorToken}
```

### Request Payout
```
POST /api/vendor/payouts
Authorization: Bearer {vendorToken}

{
  "amount": 5000,
  "bankAccount": "PK36XXXXXX1234567890",
  "bankName": "HBL",
  "accountTitle": "Ali Traders Electronics"
}
```

### Admin — List All Payouts
```
GET /api/admin/payouts?status=REQUESTED
Authorization: Bearer {adminToken}
```

### Admin — Approve Payout
```
POST /api/admin/payouts/{payoutId}/approve
Authorization: Bearer {adminToken}

{ "note": "Verified bank details" }
```

### Admin — Mark Paid
```
POST /api/admin/payouts/{payoutId}/mark-paid
Authorization: Bearer {adminToken}
```

### Admin — Reject Payout
```
POST /api/admin/payouts/{payoutId}/reject
Authorization: Bearer {adminToken}

{ "reason": "Bank details invalid" }
```

---

## 💳 Module 9: Payments

### Initiate Payment (Customer)
```
POST /api/payments/initiate
Authorization: Bearer {customerToken}

{
  "requestId": "{installmentRequestId}",
  "scheduleId": null,
  "method": "JAZZCASH"
}
```
Methods: `JAZZCASH`, `EASYPAISA`, `BANK_TRANSFER`, `RAAST`.

For `BANK_TRANSFER`:
```
{
  "requestId": "{requestId}",
  "method": "BANK_TRANSFER",
  "screenshotUrl": "https://res.cloudinary.com/.../receipt.jpg"
}
```

### Gateway Webhook (JazzCash — public, no auth)
```
POST /api/payments/callback/jazzcash
x-signature: {hash}

{ ...gateway payload... }
```

### Gateway Webhook (EasyPaisa)
```
POST /api/payments/callback/easypaisa
```

### Admin — List Pending Bank Transfer Reviews
```
GET /api/admin/payments/pending-review
Authorization: Bearer {adminToken}
```

### Admin — Approve/Reject Bank Transfer
```
POST /api/admin/payments/{paymentId}/review
Authorization: Bearer {adminToken}

{
  "decision": "APPROVE",
  "note": "Screenshot verified"
}
```

---

## 🔔 Module 10: Notifications

### List My Notifications
```
GET /api/account/notifications
Authorization: Bearer {customerToken}
```

### Unread Count
```
GET /api/account/notifications/unread-count
Authorization: Bearer {customerToken}
```

### Mark Read
```
POST /api/account/notifications/{id}/read
Authorization: Bearer {customerToken}
```

### Mark All Read
```
POST /api/account/notifications/read-all
Authorization: Bearer {customerToken}
```

### Admin — Trigger Daily Reminder Job
```
POST /api/admin/cron/reminders/run-now
Authorization: Bearer {adminToken}
```
✅ Runs pre-reminders + overdue marking immediately (for testing).

---

## 👑 Module 11: Admin + SEO

### Admin Dashboard
```
GET /api/admin/summary
Authorization: Bearer {adminToken}
```

### List Users
```
GET /api/admin/users?q=ahmed
Authorization: Bearer {adminToken}
```

### List Vendors
```
GET /api/admin/vendors?status=PENDING
Authorization: Bearer {adminToken}
```

### Approve Vendor
```
POST /api/admin/vendors/{vendorId}/approve
Authorization: Bearer {adminToken}
```

### Suspend Vendor
```
POST /api/admin/vendors/{vendorId}/suspend
Authorization: Bearer {adminToken}

{ "reason": "Repeated complaints" }
```

### KYC Queue
```
GET /api/admin/kyc
Authorization: Bearer {adminToken}
```

### Review KYC
```
POST /api/admin/kyc/{userId}/review
Authorization: Bearer {adminToken}

{
  "approve": true,
  "reason": "Documents verified"
}
```

### Audit Log
```
GET /api/admin/audit-log?limit=50
Authorization: Bearer {adminToken}
```

### SEO Pages (Admin)
```
PUT /api/admin/seo-pages
Authorization: Bearer {adminToken}

{
  "path": "/about",
  "title": "About QistPY",
  "metaDescription": "Learn about Pakistan's trusted installment marketplace.",
  "bodyHtml": "<h1>About Us</h1><p>...</p>",
  "isPublished": true
}
```

### Public SEO Page Fetch
```
GET /api/seo-pages/about
```

### Sitemap (public XML)
```
GET /api/sitemap.xml
```

---

## 🧪 End-to-End Test Scenario

Try this complete flow to verify everything:

1. **Login** as customer → save token
2. **Browse** `/api/products` → pick a product with plans
3. **Add to cart** → `POST /api/cart/items`
4. **Add address** if none → `POST /api/users/me/addresses`
5. **Checkout** → `POST /api/account/orders/checkout`
6. **Login** as vendor → save token
7. **List pending requests** → `GET /api/vendor/installment-requests`
8. **Approve** the new request → `POST /api/vendor/installment-requests/{id}/approve`
9. Schedule rows auto-generated (verify in Prisma Studio)
10. **Login** as customer → pay advance
11. **Initiate payment** → `POST /api/payments/initiate` with JazzCash mock
12. Request status moves to ACTIVE

**🎉 Full installment purchase flow tested end-to-end!**
