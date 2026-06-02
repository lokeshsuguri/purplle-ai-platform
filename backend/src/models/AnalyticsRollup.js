/**
 * AnalyticsRollup Model
 * Pre-computed hourly & daily aggregates for fast dashboard queries.
 *
 * Design: Write-time aggregation (updated when events arrive) preferred
 * over read-time aggregation for dashboard latency.
 * Rollup granularity = 1 hour. Daily rollups derived from hourly.
 */
const mongoose = require('mongoose');

const AnalyticsRollupSchema = new mongoose.Schema(
  {
    period: { type: String, enum: ['hour', 'day'], required: true },
    bucket_start: { type: Date, required: true },   // floor to hour / day UTC

    // Traffic
    entries: { type: Number, default: 0 },
    exits: { type: Number, default: 0 },
    net_footfall: { type: Number, default: 0 },      // entries - exits

    // Occupancy
    avg_occupancy: { type: Number, default: 0 },
    peak_occupancy: { type: Number, default: 0 },
    occupancy_readings: { type: Number, default: 0 },// sample count

    // Dwell
    avg_dwell_seconds: { type: Number, default: 0 },
    total_dwell_events: { type: Number, default: 0 },

    // Queue
    avg_queue_depth: { type: Number, default: 0 },
    max_queue_depth: { type: Number, default: 0 },
    queue_alert_count: { type: Number, default: 0 },

    // Crowd
    crowd_alert_count: { type: Number, default: 0 },

    // Per-camera breakdown
    camera_breakdown: {
      CAM1: { entries: Number, dwell_avg: Number },
      CAM2: { entries: Number, dwell_avg: Number },
      CAM3: { entries: Number, exits: Number },
      CAM4: { queue_avg: Number, alerts: Number },
      CAM5: { queue_avg: Number, alerts: Number },
    },
  },
  { versionKey: false }
);

// Unique constraint: one document per (period × bucket)
AnalyticsRollupSchema.index({ period: 1, bucket_start: 1 }, { unique: true });

module.exports = mongoose.model('AnalyticsRollup', AnalyticsRollupSchema);
