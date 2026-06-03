/**
 * socketManager.js
 * Initialises Socket.IO and exports getIO() for use across services.
 *
 * Why a module-level singleton? Avoids passing `io` through every function call.
 * Services can just call getIO()?.emit(…) with optional-chaining for safety.
 */
const { Server } = require('socket.io');
const logger = require('../utils/logger');

let io = null;

const allowedSocketOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:5173,https://purplle-ai-platform-git-main-lokeswara-suguris-projects.vercel.app,https://purplle-ai-platform.onrender.com')
  .split(',')
  .map(origin => origin.trim())
  .filter(Boolean);

const initSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: (origin, callback) => {
        if (!origin) return callback(null, true);
        if (allowedSocketOrigins.includes(origin) || origin.endsWith('.vercel.app')) {
          return callback(null, true);
        }
        return callback(new Error(`Origin ${origin} not allowed by Socket.IO CORS`));
      },
      methods: ['GET', 'POST'],
    },
    transports: ['websocket', 'polling'],
    pingInterval: 10000,
    pingTimeout: 5000,
  });

  io.on('connection', (socket) => {
    logger.info(`Socket connected: ${socket.id}`);

    // Client can request a room for camera-specific updates
    socket.on('join:camera', (cameraId) => {
      socket.join(`camera:${cameraId}`);
      logger.info(`Socket ${socket.id} joined camera:${cameraId}`);
    });

    // Client acknowledges an alert
    socket.on('alert:ack', async ({ eventId }) => {
      try {
        const Event = require('../models/Event');
        await Event.findByIdAndUpdate(eventId, { $set: { acknowledged: true } });
        socket.broadcast.emit('alert:acknowledged', { eventId });
      } catch (err) {
        logger.warn(`Alert ack failed: ${err.message}`);
      }
    });

    socket.on('disconnect', (reason) => {
      logger.info(`Socket disconnected: ${socket.id} — ${reason}`);
    });
  });

  logger.info('✅ Socket.IO initialised');
  return io;
};

const getIO = () => io;

module.exports = { initSocket, getIO };
