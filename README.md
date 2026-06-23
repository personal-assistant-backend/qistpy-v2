# QistPY — Complete Installment Marketplace 🚀

**Backend:** NestJS + Prisma + PostgreSQL (~80 endpoints, 11 modules)
**Frontend:** Angular 18 + Tailwind (25+ pages)

---

## ⚠️ Setup Location

Use `C:\dev\qistpy\` — NOT OneDrive folder.

---

## 📦 First-Time Setup

### 1. Backup `.env` + delete old folder
```cmd
copy C:\dev\qistpy\.env C:\dev\qistpy-env-backup.env
cd C:\dev
rmdir /s /q qistpy
```

### 2. Extract `qistpy-complete.zip` → `C:\dev\`

### 3. Put back your `.env` (BOTH locations)
```cmd
copy C:\dev\qistpy-env-backup.env C:\dev\qistpy\.env
copy C:\dev\qistpy-env-backup.env C:\dev\qistpy\apps\api\.env
```

### 4. Install + generate
```cmd
cd C:\dev\qistpy
pnpm install
pnpm prisma:generate
```

### 5. Clear Angular cache (important after updates)
```cmd
cd apps\web
rmdir /s /q .angular
cd ..\..
```

### 6. Run both servers (2 CMD windows)

**Window 1 — Backend:**
```cmd
cd C:\dev\qistpy
pnpm dev:api
```
→ http://localhost:3000/api

**Window 2 — Frontend:**
```cmd
cd C:\dev\qistpy
pnpm dev:web
```
→ http://localhost:4200

---

## 🔑 Test Accounts

| Role | Phone | Password |
|------|-------|----------|
| Admin | `+923000000001` | `ChangeMe_123!` |
| Vendor | `+923001112233` | `VendorTest123` |
| Customer | `+923001234567` | `TestUser123` |

---

## 🎯 Complete Feature List

### Frontend Pages (25+)

**Public:**
- `/` — Professional homepage (hero, categories, products, testimonials, CTA)
- `/shop` — Products listing with filters, sort, pagination
- `/shop/:category` — Category-filtered products
- `/product/:slug` — Product detail with "Total You'll Pay"
- `/how-it-works` — Step-by-step guide
- `/about` — Company info + stats
- `/contact` — Contact form + info
- `/faqs` — 8 FAQs in accordion
- `/terms` — Terms of Service
- `/privacy` — Privacy Policy

**Auth:**
- `/login` — Phone + password
- `/signup` — 3-step OTP flow (phone → OTP → complete)
- `/forgot-password` — Reset via OTP

**Customer (auth required):**
- `/cart` — Cart with quantity + totals
- `/checkout` — Address selection + order placement
- `/account` — Dashboard overview with stats
- `/account/orders` — Orders list + detail
- `/account/installments` — Installments list + schedule + "Pay Now"
- `/account/addresses` — Full address CRUD
- `/account/profile` — Profile edit + password change
- `/account/notifications` — In-app notifications

**Vendor (VENDOR role):**
- `/vendor` — Dashboard with KPIs, wallet balance, pending requests with approve/reject

**Admin (ADMIN role):**
- `/admin` — 7 tabs: Summary, Users, Vendors, KYC Queue, Payouts, Payments Review, Audit Log
- Manual cron trigger button for daily reminders

### Backend (80+ endpoints, 11 modules)

See `TESTING.md` for complete API reference.

---

## 🧪 End-to-End Test Flow

1. **Signup** → `/signup` → Enter phone → Check API console for OTP hint → Complete
2. **Browse** → `/shop` → Pick any product
3. **View detail** → Click product → See "Total You'll Pay" with plan selector
4. **Add to cart** → Select plan → Click "Buy on Installments"
5. **Add address** → `/account/addresses` → Add your address
6. **Checkout** → `/cart` → "Proceed to Checkout" → Place Order
7. **Login as vendor** → `+923001112233 / VendorTest123`
8. **Approve request** → `/vendor` → Approve pending installment request
9. **Back as customer** → `/account/installments` → See schedule rows generated
10. **Pay** → Click "Pay Now" on any schedule → See mock JazzCash redirect
11. **Login as admin** → `+923000000001` → Run reminders, review payments, manage KYC

**🎉 Complete end-to-end flow — signup → browse → buy → approve → pay → manage!**

---

## 🛠️ Troubleshooting

### "Cannot reach API"
Ensure backend window is running. Test: open `http://localhost:3000/api/products` — should return JSON.

### Frontend compile error / cache issue
```cmd
cd C:\dev\qistpy\apps\web
rmdir /s /q .angular
cd ..\..
pnpm dev:web
```

### Icons not showing
Already fixed with DomSanitizer. If still missing, clear Angular cache as above.

### Login redirects to login again
Token got cleared. Try incognito window or clear `localStorage`.

### "NG0210: DOCUMENT not available"
SSR issue — should be fixed. If recurring, verify `angular.json` has no `server` / `ssr` fields.

---

## 📊 Project Status

| Phase | Status |
|-------|--------|
| Phase A — Foundation + DB (28 tables) | ✅ |
| Phase B — Modules 1–11 (backend 80+ endpoints) | ✅ |
| Phase C — Frontend (25+ pages) | ✅ |
| Phase D — Deployment preparation | ⏳ |
| Phase E — Production deploy | ⏳ |

**90% of project complete. Only deployment remains!** 🎉

---

## 📚 Docs

- **TESTING.md** — All 80 endpoints with payloads
- **Brief Phase 13.B** unit tests: `pnpm --filter @qistpy/api test`

---

## 🔐 Security Notes

- JWT access tokens (15min) + httpOnly refresh cookies (7d)
- Bcrypt password hashing (cost 12)
- Rate limits on auth endpoints (5 login/15min, 3 OTP/hour)
- Webhook signature verification for payment gateways
- Role-based access guards on frontend + backend
- CNIC masked in API responses (first 5 + last 2 digits only)

---

**🎊 Mubarak ho! Aap ka complete e-commerce installment marketplace tayar hai!** 🇵🇰
