const mongoose = require('mongoose');

const CameraSchema = new mongoose.Schema(
  {
    camera_id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    location: { type: String, required: true },
    role: {
      type: String,
      enum: ['browsing', 'entry_exit', 'billing', 'operations'],
      required: true,
    },
    status: {
      type: String,
      enum: ['online', 'offline', 'degraded'],
      default: 'online',
    },
    last_heartbeat: { type: Date, default: Date.now },
    resolution: { type: String, default: '1080p' },
    fps: { type: Number, default: 30 },
    stream_url: { type: String },   // RTSP / HLS endpoint (populated in production)
    config: {
      dwell_zone_enabled: { type: Boolean, default: false },
      queue_zone_enabled: { type: Boolean, default: false },
      entry_line_y: { type: Number },   // normalised Y coordinate for entry line
    },
  },
  { timestamps: true, versionKey: false }
);

module.exports = mongoose.model('Camera', CameraSchema);
