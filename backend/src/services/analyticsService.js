const Event = require('../models/Event');
const AnalyticsRollup = require('../models/AnalyticsRollup');
const OccupancySnapshot = require('../models/OccupancySnapshot');
const logger = require('../utils/logger');

class AnalyticsService {
  /**
   * Hourly footfall chart data for the past N hours.
   */
  async getHourlyFootfall(hours = 24) {
    const since = new Date(Date.now() - hours * 3600 * 1000);

    const rollups = await AnalyticsRollup.find({
      period: 'hour',
      bucket_start: { $gte: since },
    })
      .sort({ bucket_start: 1 })
      .lean();

    return rollups.map(r => ({
      hour: r.bucket_start,
      entries: r.entries || 0,
      exits: r.exits || 0,
      net_footfall: r.net_footfall || 0,
      peak_occupancy: r.peak_occupancy || 0,
    }));
  }

  /**
   * Dwell time distribution — average by camera for browsing zones.
   */
  async getDwellAnalytics(since) {
    const fromDate = since ? new Date(since) : new Date(Date.now() - 24 * 3600 * 1000);

    const pipeline = [
      {
        $match: {
          event_type: 'DWELL_TIME',
          timestamp: { $gte: fromDate },
          'dwell.duration_seconds': { $gt: 0 },
        },
      },
      {
        $group: {
          _id: { camera: '$camera_id', zone: '$dwell.zone' },
          avg_dwell: { $avg: '$dwell.duration_seconds' },
          max_dwell: { $max: '$dwell.duration_seconds' },
          min_dwell: { $min: '$dwell.duration_seconds' },
          count: { $sum: 1 },
          // Bucket distribution
          under_30s: {
            $sum: { $cond: [{ $lt: ['$dwell.duration_seconds', 30] }, 1, 0] },
          },
          s30_to_120: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $gte: ['$dwell.duration_seconds', 30] },
                    { $lt: ['$dwell.duration_seconds', 120] },
                  ],
                },
                1,
                0,
              ],
            },
          },
          over_120s: {
            $sum: { $cond: [{ $gte: ['$dwell.duration_seconds', 120] }, 1, 0] },
          },
        },
      },
      { $sort: { '_id.camera': 1 } },
    ];

    const raw = await Event.aggregate(pipeline);

    return raw.map(r => ({
      camera_id: r._id.camera,
      zone: r._id.zone || 'general',
      avg_dwell_seconds: Math.round(r.avg_dwell),
      max_dwell_seconds: Math.round(r.max_dwell),
      count: r.count,
      distribution: {
        under_30s: r.under_30s,
        s30_to_120: r.s30_to_120,
        over_120s: r.over_120s,
      },
    }));
  }

  /**
   * Queue depth over time for billing/ops cameras.
   */
  async getQueueTrend(hours = 8) {
    const since = new Date(Date.now() - hours * 3600 * 1000);

    const pipeline = [
      {
        $match: {
          event_type: 'QUEUE_ALERT',
          camera_id: { $in: ['CAM4', 'CAM5'] },
          timestamp: { $gte: since },
        },
      },
      {
        $group: {
          _id: {
            camera: '$camera_id',
            bucket: {
              $toDate: {
                $subtract: [
                  { $toLong: '$timestamp' },
                  { $mod: [{ $toLong: '$timestamp' }, 15 * 60 * 1000] }, // 15-min buckets
                ],
              },
            },
          },
          avg_depth: { $avg: '$queue.depth' },
          max_depth: { $max: '$queue.depth' },
          alert_count: { $sum: { $cond: ['$is_alert', 1, 0] } },
        },
      },
      { $sort: { '_id.bucket': 1 } },
    ];

    const raw = await Event.aggregate(pipeline);

    return raw.map(r => ({
      camera_id: r._id.camera,
      bucket: r._id.bucket,
      avg_queue_depth: Math.round(r.avg_depth * 10) / 10,
      max_queue_depth: r.max_depth,
      alert_count: r.alert_count,
    }));
  }

  /**
   * Peak hour analysis — which hours of day see most footfall.
   */
  async getPeakHours(days = 7) {
    const since = new Date(Date.now() - days * 24 * 3600 * 1000);

    const pipeline = [
      {
        $match: {
          event_type: { $in: ['ENTRY', 'EXIT'] },
          timestamp: { $gte: since },
        },
      },
      {
        $group: {
          _id: { hour: { $hour: '$timestamp' }, type: '$event_type' },
          count: { $sum: 1 },
        },
      },
      {
        $group: {
          _id: '$_id.hour',
          entries: {
            $sum: { $cond: [{ $eq: ['$_id.type', 'ENTRY'] }, '$count', 0] },
          },
          exits: {
            $sum: { $cond: [{ $eq: ['$_id.type', 'EXIT'] }, '$count', 0] },
          },
        },
      },
      { $sort: { _id: 1 } },
    ];

    const raw = await Event.aggregate(pipeline);

    return raw.map(r => ({
      hour: r._id,
      entries: r.entries,
      exits: r.exits,
      total_footfall: r.entries + r.exits,
    }));
  }

  /**
   * KPI summary for the dashboard header cards.
   */
  async getKPISummary() {
    const now = new Date();
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);

    const [snapshot, todayRollups, alertCount] = await Promise.all([
      OccupancySnapshot.findOne({ store_id: 'main' }).lean(),
      AnalyticsRollup.find({ period: 'hour', bucket_start: { $gte: todayStart } }).lean(),
      Event.countDocuments({ is_alert: true, timestamp: { $gte: todayStart } }),
    ]);

    const todayEntries = todayRollups.reduce((s, r) => s + (r.entries || 0), 0);
    const todayExits = todayRollups.reduce((s, r) => s + (r.exits || 0), 0);
    const avgDwell = await Event.aggregate([
      { $match: { event_type: 'DWELL_TIME', timestamp: { $gte: todayStart } } },
      { $group: { _id: null, avg: { $avg: '$dwell.duration_seconds' } } },
    ]);

    return {
      current_occupancy: snapshot?.current_count || 0,
      occupancy_threshold: snapshot?.threshold || 50,
      occupancy_pct: Math.round(((snapshot?.current_count || 0) / (snapshot?.threshold || 50)) * 100),
      today_entries: todayEntries || snapshot?.today_entries || 0,
      today_exits: todayExits || snapshot?.today_exits || 0,
      peak_today: snapshot?.peak_today || { count: 0 },
      avg_dwell_seconds: Math.round(avgDwell[0]?.avg || 0),
      alerts_today: alertCount,
    };
  }
}

module.exports = new AnalyticsService();
