import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';

import { connectDb, getDb } from './db.js';
import authRoutes from './routes/auth.js';
import eventsRoutes from './routes/events.js';
import categoriesRoutes from './routes/categories.js';
import citiesRoutes from './routes/cities.js';
import countriesRoutes from './routes/countries.js';
import slidersRoutes from './routes/sliders.js';
import companiesRoutes from './routes/companies.js';
import staffRoutes from './routes/staff.js';
import ordersRoutes from './routes/orders.js';
import reviewsRoutes from './routes/reviews.js';
import paymentsRoutes from './routes/payments.js';
import customersRoutes from './routes/customers.js';
import uploadRoutes from './routes/upload.js';

const app = express();

// Ensure uploads folder exists
const uploadsDir = path.resolve(process.cwd(), 'public', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Cookie parsing middleware
app.use((req, res, next) => {
  req.cookies = {};
  if (req.headers.cookie) {
    req.headers.cookie.split(';').forEach(cookie => {
      const parts = cookie.split('=');
      const key = parts[0]?.trim();
      const val = parts.slice(1).join('=').trim();
      if (key) req.cookies[key] = decodeURIComponent(val);
    });
  }
  next();
});

// Language prefix stripper: e.g. /en/api/v3/... -> /api/v3/...
app.use((req, res, next) => {
  const match = req.url.match(/^\/(en|ka|ru|hi|ar|he)(\/.*|$)/i);
  if (match) {
    req.lang = match[1].toLowerCase();
    req.url = match[2] || '/';
  }
  next();
});

// Global middlewares
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({
  limit: '50mb',
  verify: (req, res, buf) => {
    req.rawBody = buf;
  }
}));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Serve static uploads
app.use('/uploads', express.static(uploadsDir));

// Health check
app.get(['/api/health', '/api/v3/health', '/health'], async (req, res) => {
  try {
    const db = await getDb();
    const collections = await db.listCollections().toArray();
    const rawUri = process.env.MONGODB_URI || 'DEFAULT_URI_USED';
    const cluster = rawUri.includes('@') ? rawUri.split('@')[1].split('/')[0] : 'no-cluster';
    return res.json({
      status: 'ok',
      mongodb: 'connected',
      database: db.databaseName,
      cluster,
      has_env_uri: Boolean(process.env.MONGODB_URI),
      env_db_name: process.env.MONGODB_DB_NAME || null,
      collections: collections.map(c => c.name)
    });
  } catch (err) {
    return res.status(500).json({ status: 'error', error: err.message });
  }
});

// Dynamic / Static Sitemap.xml
app.get(['/sitemap.xml', '/api/sitemap.xml'], (req, res) => {
  const possiblePaths = [
    path.resolve(process.cwd(), 'funfinder-xi', 'public', 'sitemap.xml'),
    path.resolve(process.cwd(), 'public', 'sitemap.xml'),
    path.resolve(process.cwd(), '..', 'funfinder-xi', 'public', 'sitemap.xml')
  ];
  for (const p of possiblePaths) {
    if (fs.existsSync(p)) {
      res.header('Content-Type', 'application/xml');
      return res.sendFile(p);
    }
  }
  return res.status(404).send('Sitemap not found');
});

// Robots.txt
app.get(['/robots.txt', '/api/robots.txt'], (req, res) => {
  res.type('text/plain');
  res.send("User-agent: *\nDisallow: /admin\nDisallow: /staff\n\nSitemap: https://funfinder.ge/sitemap.xml\n");
});

// Helper to mount routers at multiple URL prefixes
function mountMulti(prefixes, router) {
  prefixes.forEach(prefix => {
    app.use(prefix, router);
  });
}

// 1. Auth routes (admin / staff)
mountMulti(['/api/auth', '/api/v1/auth', '/api/v2/auth', '/auth', '/v1/auth', '/v2/auth'], authRoutes);

// 2. Orders routes
mountMulti([
  '/api/v5/order',
  '/api/v2/event/orders',
  '/api/event/orders',
  '/api/v1/orders',
  '/api/orders',
  '/api/v1/order',
  '/api/order',
  '/v5/order',
  '/v2/event/orders',
  '/event/orders',
  '/order',
  '/orders'
], ordersRoutes);

// 3. Events & Services routes
mountMulti([
  '/api/event',
  '/api/events',
  '/api/v1/event',
  '/api/v1/events',
  '/api/v2/event',
  '/api/v2/events',
  '/api/v3/event',
  '/api/v3/events',
  '/api/v5/event',
  '/api/v5/events',
  '/api/service',
  '/api/services',
  '/api/v1/service',
  '/api/v1/services',
  '/api/v2/service',
  '/api/v2/services',
  '/api/v3/service',
  '/api/v3/services',
  '/event',
  '/events',
  '/service',
  '/services',
  '/v1/event',
  '/v1/events',
  '/v2/event',
  '/v2/events',
  '/v3/event',
  '/v3/events',
  '/v3/service',
  '/v3/services'
], eventsRoutes);

// 4. Categories routes
mountMulti([
  '/api/category',
  '/api/categories',
  '/api/v1/category',
  '/api/v1/categories',
  '/api/v2/category',
  '/api/v2/categories',
  '/api/v3/category',
  '/api/v3/categories',
  '/api/services/companycategory',
  '/api/v1/services/companycategory',
  '/category',
  '/categories',
  '/v1/category',
  '/v1/categories',
  '/v2/category',
  '/v2/categories',
  '/v3/category',
  '/v3/categories',
  '/services/companycategory'
], categoriesRoutes);

// 5. Cities routes
mountMulti([
  '/api/city',
  '/api/cities',
  '/api/v1/city',
  '/api/v1/cities',
  '/api/v2/city',
  '/api/v2/cities',
  '/api/v3/city',
  '/api/v3/cities',
  '/city',
  '/cities',
  '/v1/city',
  '/v1/cities',
  '/v3/city',
  '/v3/cities'
], citiesRoutes);

// 6. Countries routes
mountMulti(['/api/country', '/api/countries', '/api/v1/country', '/api/v2/country', '/country', '/v1/country'], countriesRoutes);

// 7. Sliders routes
mountMulti([
  '/api/slider',
  '/api/sliders',
  '/api/v1/slider',
  '/api/v1/sliders',
  '/api/v3/slider',
  '/api/v3/sliders',
  '/slider',
  '/sliders',
  '/v1/slider',
  '/v1/sliders',
  '/v3/slider',
  '/v3/sliders'
], slidersRoutes);

// 8. Companies routes (MUST be mounted before /staff so /staff/company matches first)
mountMulti([
  '/api/staff/company',
  '/api/v1/staff/company',
  '/api/v2/staff/company',
  '/api/company',
  '/api/companies',
  '/api/v1/company',
  '/staff/company',
  '/v1/staff/company',
  '/company',
  '/companies'
], companiesRoutes);

// 9. Staff / Admin User routes
mountMulti([
  '/api/staff',
  '/api/v1/staff',
  '/api/v2/staff',
  '/api/users',
  '/api/v1/users',
  '/staff',
  '/v1/staff',
  '/users'
], staffRoutes);

// 10. Reviews routes
mountMulti([
  '/api/v3/review',
  '/api/v2/review',
  '/api/review',
  '/v3/review',
  '/v2/review',
  '/review'
], reviewsRoutes);

// 11. Payments routes (BOG, Google Pay, Apple Pay, SendGrid Emails)
mountMulti([
  '/api/v5/payment',
  '/api/v5/payments',
  '/api/payment',
  '/api/payments',
  '/api/orders/bog',
  '/api/orders/payment',
  '/api/v5/email',
  '/api/email',
  '/v5/payment',
  '/v5/payments',
  '/payment',
  '/payments'
], paymentsRoutes);

// 12. Customers auth & profile routes (front customer authentication)
mountMulti([
  '/api/v3/customer',
  '/api/v3/customers',
  '/api/customer',
  '/api/customers',
  '/v3/customer',
  '/v3/customers',
  '/customer',
  '/customers',
  '/api/v3/auth',
  '/v3/auth',
  '/api/auth/customer',
  '/auth/customer'
], customersRoutes);

// 13. Universal upload routes
mountMulti([
  '/api/upload',
  '/api/uploads',
  '/api/v1/upload',
  '/api/v3/upload',
  '/api/v5/upload',
  '/api/file/upload'
], uploadRoutes);

// Ensure DB connects on init
connectDb().catch(err => {
  console.warn('Initial MongoDB connection deferred:', err.message);
});

export default app;
