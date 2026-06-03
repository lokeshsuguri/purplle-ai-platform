require('dotenv').config();
const http = require('http');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const connectDB = require('../config/database');
const logger = require('./utils/logger');
const { initSocket } = require('./socket/socketManager');

// Route imports
const eventRoutes = require('./routes/eventRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const cameraRoutes = require('./routes/cameraRoutes');
const occupancyRoutes = require('./routes/occupancyRoutes');
const healthRoutes = require('./routes/healthRoutes');

const app = express();
const server = http.createServer(app);

// ── Connect DB ────────────────────────────────────────────────────────────────
connectDB();

// ── Security middleware ───────────────────────────────────────────────────────
app.use(helmet());
app.use(compression());
const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:5173,https://purplle-ai-platform-git-main-lokeswara-suguris-projects.vercel.app,https://purplle-ai-platform.onrender.com')
  .split(',')
  .map(origin => origin.trim())
  .filter(Boolean);
app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin) || origin.endsWith('.vercel.app')) {
      return callback(null, true);
    }
    return callback(new Error(`Origin ${origin} not allowed by CORS`));
  },
  credentials: true,
}));

// ── Rate limiting ─────────────────────────────────────────────────────────────
const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', apiLimiter);

// ── Request logging & parsing ─────────────────────────────────────────────────
app.use(morgan('combined', { stream: { write: msg => logger.info(msg.trim()) } }));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

// ── Routes ────────────────────────────────────────────────────────────────────
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Purplle AI Backend is running'
  });
});
app.use('/api/events', eventRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/cameras', cameraRoutes);
app.use('/api/occupancy', occupancyRoutes);
app.use('/health', healthRoutes);


// ── 404 handler ───────────────────────────────────────────────────────────────
app.use((req, res) => res.status(404).json({ success: false, message: 'Route not found' }));

// ── Global error handler ──────────────────────────────────────────────────────
app.use((err, req, res, _next) => {
  logger.error(`Unhandled error: ${err.message}`, { stack: err.stack });
  res.status(err.status || 500).json({
    success: false,
    message: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
  });
});

// ── Socket.IO ─────────────────────────────────────────────────────────────────
initSocket(server);

// ── Start ─────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  logger.info(`🟣 Purplle AI Backend running on port ${PORT} [${process.env.NODE_ENV}]`);
});

module.exports = { app, server };
