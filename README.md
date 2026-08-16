# Dezire More

A full-stack e-commerce platform for ethnic wear — sarees, dress materials, ready-to-wear, western apparel, and jewelry/accessories. Live storefront, admin dashboard, and a native Android app, all built on one codebase.

## Features

**Storefront**
- Product browsing with category pages, filters (color/size/fabric/occasion/price/discount), and fuzzy search
- Cart, wishlist, and a full checkout flow supporting Razorpay, manual UPI/bank transfer, and Cash on Delivery
- Product ratings & reviews (with photo uploads, helpful votes, verified-purchase badges)
- Order tracking with live courier status, invoice download, and cancellation
- Premium membership tiers (Gold/Platinum) with manual UPI payment + admin confirmation
- Account dashboard: order history, saved addresses, wishlist, profile, notifications
- AI-assisted chat support widget for order/product questions
- Installable as a native Android app (same codebase, no separate rewrite)

**Admin Panel**
- Product catalog management (create/edit/delete, bulk import, stock toggling)
- Order management: status updates, manual payment verification, WhatsApp update links
- Courier integration (Delhivery, Shiprocket, or free manual tracking-number entry)
- Customer, coupon, testimonial, and membership management
- Full audit log of admin actions, with month-wise cleanup
- Owner/founder profile management for the "Our Story" page

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React (Vite), React Router, Context API |
| Backend | Node.js, Express, MongoDB (Mongoose) |
| Auth | JWT, bcrypt |
| Payments | Razorpay, manual UPI/QR |
| Media | Cloudinary |
| Notifications | Firebase Cloud Messaging, email |
| Mobile | Capacitor (Android/iOS) |
| Hosting | Vercel (frontend), Render (backend) |

No UI framework (Tailwind/Bootstrap/MUI) — styling is hand-written CSS with a custom design system (light/dark theme support included).

## Project Structure

```
src/                  React frontend (components, contexts, hooks, utils)
dezire-backend/        Express API (routes, models, services, admin panel)
android/, ios/         Capacitor native app projects
public/                Static assets
```

## Getting Started

**Frontend**
```bash
npm install
npm run dev       # local dev server
npm run build     # production build
```

**Backend**
```bash
cd dezire-backend
npm install
npm run dev       # nodemon, auto-reload
```

Copy `.env.example` (or ask for the required variables) into `dezire-backend/.env` — MongoDB connection string, JWT secret, Razorpay keys, Cloudinary credentials, etc.

**Android app**
```bash
npm run cap:android   # builds the web app, syncs, opens Android Studio
```

## License

Private/proprietary — all rights reserved.
