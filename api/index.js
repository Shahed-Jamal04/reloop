import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import authRoutes from './routes/auth.js';
import statsRoutes from './routes/stats.js';
import materialsRoutes from './routes/materials.js';
import adminRoutes from './routes/admin.js';
import requestsRoutes from './routes/requests.js';
import messagesRoutes from './routes/messages.js';
import ordersRoutes from './routes/orders.js';
import uploadsRoutes from './routes/uploads.js';
import testimonialsRoutes from './routes/testimonials.js';
import usersRoutes from './routes/users.js';
import { getConnection, closeConnection } from './db.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middleware
app.use(express.json());

// CORS: support one or more comma-separated origins in FRONTEND_URL.
// Example: FRONTEND_URL=https://reloop.netlify.app,https://deploy-preview-12--reloop.netlify.app
const allowedOrigins = (process.env.FRONTEND_URL || 'http://localhost:3000')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

app.use(cors({
  origin: (origin, cb) => {
    // allow same-origin / curl / health checks (no Origin header)
    if (!origin) return cb(null, true);
    if (allowedOrigins.includes(origin)) return cb(null, true);
    // allow any *.netlify.app preview deploy if main site is a netlify one
    if (allowedOrigins.some((o) => o.endsWith('.netlify.app')) && /\.netlify\.app$/.test(new URL(origin).hostname)) {
      return cb(null, true);
    }
    return cb(new Error(`CORS blocked: ${origin}`));
  },
  credentials: true,
}));

// Static uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/materials', materialsRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/requests', requestsRoutes);
// messages live under /api/requests/:id/messages (same router, mounted a second time)
app.use('/api/requests', messagesRoutes);
app.use('/api/orders', ordersRoutes);
app.use('/api/uploads', uploadsRoutes);
app.use('/api/testimonials', testimonialsRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'Server is running' });
});

// Start server
app.listen(PORT, async () => {
  try {
    await getConnection();
    console.log(`✓ Server running on http://localhost:${PORT}`);
  } catch (err) {
    console.error('Failed to connect to database');
    process.exit(1);
  }
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\nShutting down...');
  await closeConnection();
  process.exit(0);
});