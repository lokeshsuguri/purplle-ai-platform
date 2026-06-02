/**
 * OccupancySnapshot Model
 * Rolling store-level occupancy state, updated on every ENTRY/EXIT event.
 * Using a single "singleton" document (store_id = 'main') updated via
 * findOneAndUpdate + $set to avoid unbounded growth.
 *
 * Why not just query events? Because calculating live occupancy from ENTRY-EXIT
 * counts would require a full collection scan on every dashboard poll.
 * A materialised snapshot is O(1) read.
 */
const mongoose = require('mongoose');

const OccupancySnapshotSchema = new mongoose.Schema(
  {
    store_id: { type: String, default: 'main', unique: true },

    current_count: { type: Number, default: 0, min: 0 },
    threshold: { type: Number, default: 50 },

    today_entries: { type: Number, default: 0 },
    today_exits: { type: Number, default: 0 },

    peak_today: {
      count: { type: Number, default: 0 },
      at: { type: Date },
    },

    // Per-camera person count (updated by AI service)
    camera_counts: {
      CAM1: { type: Number, default: 0 },
      CAM2: { type: Number, default: 0 },
      CAM3: { type: Number, default: 0 },
      CAM4: { type: Number, default: 0 },
      CAM5: { type: Number, default: 0 },
    },

    last_updated: { type: Date, default: Date.now },
  },
  { versionKey: false }
);

module.exports = mongoose.model('OccupancySnapshot', OccupancySnapshotSchema);
