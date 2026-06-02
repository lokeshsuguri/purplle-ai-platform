/**
 * Event Model
 * Stores every detected event from the AI pipeline.
 *
 * Design decision: single collection, event_type discriminator.
 * Simplifies querying, especially for time-series aggregations.
 * Alternative (separate collections per type) was rejected — over-engineering
 * for the expected volume and query patterns.
 */
const mongoose = require('mongoose');

const EventSchema = new mongoose.Schema(
  {
    event_type: {
      type: String,
      enum: ['ENTRY', 'EXIT', 'DWELL_TIME', 'QUEUE_ALERT', 'CROWD_ALERT'],
      required: true,
      index: true,
    },
    camera_id: {
      type: String,
      required: true,
      enum: ['CAM1', 'CAM2', 'CAM3', 'CAM4', 'CAM5'],
      index: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },

    // Person tracking payload (ENTRY / EXIT / DWELL_TIME)
    person: {
      track_id: { type: Number },             // ByteTrack assigned ID
      bbox: {                                  // [x1, y1, x2, y2] normalised 0-1
        type: [Number],
        validate: v => !v || v.length === 4,
      },
      confidence: { type: Number, min: 0, max: 1 },
    },

    // Dwell time payload
    dwell: {
      duration_seconds: { type: Number, min: 0 },
      zone: { type: String },                  // aisle / shelf / checkout
    },

    // Queue alert payload
    queue: {
      depth: { type: Number, min: 0 },         // persons in queue
      wait_time_estimate_seconds: { type: Number },
    },

    // Crowd / occupancy payload
    crowd: {
      current_count: { type: Number, min: 0 },
      threshold: { type: Number },
      severity: { type: String, enum: ['LOW', 'MEDIUM', 'HIGH'] },
    },

    // Store-level snapshot at event time
    store_snapshot: {
      total_occupancy: { type: Number, default: 0 },
      active_cameras: { type: Number, default: 5 },
    },

    // AI metadata
    ai_meta: {
      model_version: { type: String, default: 'yolov8n' },
      inference_ms: { type: Number },
      frame_index: { type: Number },
    },

    is_alert: { type: Boolean, default: false, index: true },
    acknowledged: { type: Boolean, default: false },
  },
  {
    timestamps: true,
    versionKey: false,
    // TTL: retain raw events for 30 days; analytics rollups are separate
    expireAfterSeconds: 30 * 24 * 60 * 60,
  }
);

// Compound index for time-range queries per camera
EventSchema.index({ camera_id: 1, timestamp: -1 });
// Compound index for alert queries
EventSchema.index({ is_alert: 1, timestamp: -1 });
// For occupancy timeline queries
EventSchema.index({ event_type: 1, timestamp: -1 });

module.exports = mongoose.model('Event', EventSchema);
