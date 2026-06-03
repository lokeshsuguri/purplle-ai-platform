/**
 * EventService
 * Receives raw AI detections, applies business rules, persists events,
 * updates occupancy snapshot, and emits Socket.IO notifications.
 *
 * Trade-off: business logic lives here (service layer) not in the controller.
 * Controllers stay thin — just HTTP plumbing.
 */
const Event = require('../models/Event');
const OccupancySnapshot = require('../models/OccupancySnapshot');
const AnalyticsRollup = require('../models/AnalyticsRollup');
const logger = require('../utils/logger');
const { getIO } = require('../socket/socketManager');

const OCCUPANCY_THRESHOLD = parseInt(process.env.OCCUPANCY_THRESHOLD || '50');
const CROWD_COOLDOWN_MS = parseInt(process.env.CROWD_ALERT_COOLDOWN_MS || '60000');

// In-memory cooldown tracker (per-store; stateless across restarts — acceptable)
const lastCrowdAlert = new Map();

class EventService {
  /**
   * Ingest a batch of AI detections and produce business events.
   * Called by POST /api/events/ingest
   */
  async ingestBatch(detections) {
    const savedEvents = [];

    for (const detection of detections) {
      try {
        const events = await this._processDetection(detection);
        savedEvents.push(...events);
      } catch (err) {
        logger.error(`Failed processing detection: ${err.message}`, detection);
      }
    }

    return savedEvents;
  }

  async _processDetection(detection) {
    const { event_type, camera_id, timestamp, payload, ai_meta } = detection;
    const events = [];

    const baseEvent = {
      event_type,
      camera_id,
      timestamp: timestamp ? new Date(timestamp) : new Date(),
      ai_meta,
    };

    switch (event_type) {
      case 'ENTRY':
      case 'EXIT': {
        const event = await this._handleEntryExit({ ...baseEvent, payload });
        events.push(event);

        // Check if crowd alert should fire
        const crowdAlert = await this._checkCrowdAlert(camera_id, timestamp);
        if (crowdAlert) events.push(crowdAlert);
        break;
      }

      case 'DWELL_TIME': {
        const event = await this._handleDwellTime({ ...baseEvent, payload });
        events.push(event);
        break;
      }

      case 'QUEUE_ALERT': {
        const event = await this._handleQueueAlert({ ...baseEvent, payload });
        events.push(event);
        break;
      }

      default:
        logger.warn(`Unknown event type: ${event_type}`);
    }

    // Emit all events via Socket.IO
    for (const ev of events) {
      this._emitEvent(ev);
    }

    return events;
  }

  async _handleEntryExit({ event_type, camera_id, timestamp, payload, ai_meta }) {
    const delta = event_type === 'ENTRY' ? 1 : -1;

    // Upsert occupancy snapshot (atomic)
    const snapshot = await OccupancySnapshot.findOneAndUpdate(
      { store_id: 'main' },
      {
        $inc: {
          current_count: delta,
          today_entries: event_type === 'ENTRY' ? 1 : 0,
          today_exits: event_type === 'EXIT' ? 1 : 0,
          [`camera_counts.${camera_id}`]: delta,
        },
        $set: { last_updated: new Date() },
      },
      { upsert: true, new: true }
    );

    // Update peak if needed
    if (snapshot.current_count > (snapshot.peak_today?.count || 0)) {
      await OccupancySnapshot.findOneAndUpdate(
        { store_id: 'main' },
        { $set: { 'peak_today.count': snapshot.current_count, 'peak_today.at': new Date() } }
      );
    }

    const event = new Event({
      ...{ event_type, camera_id, timestamp, ai_meta },
      person: {
        track_id: payload?.track_id,
        bbox: payload?.bbox,
        confidence: payload?.confidence,
      },
      store_snapshot: { total_occupancy: Math.max(0, snapshot.current_count) },
    });
    await event.save();

    // Update hourly rollup
    await this._upsertRollup(timestamp || new Date(), {
      $inc: {
        entries: event_type === 'ENTRY' ? 1 : 0,
        exits: event_type === 'EXIT' ? 1 : 0,
        net_footfall: delta,
      },
    });

    // Emit occupancy update to dashboard
    getIO()?.emit('occupancy:update', {
      current_count: Math.max(0, snapshot.current_count),
      today_entries: snapshot.today_entries,
      today_exits: snapshot.today_exits,
      peak_today: snapshot.peak_today,
      threshold: snapshot.threshold,
    });

    return event.toObject();
  }

  async _handleDwellTime({ event_type, camera_id, timestamp, payload, ai_meta }) {
    const event = new Event({
      event_type,
      camera_id,
      timestamp,
      ai_meta,
      person: { track_id: payload?.track_id, bbox: payload?.bbox },
      dwell: {
        duration_seconds: payload?.duration_seconds,
        zone: payload?.zone,
      },
    });
    await event.save();

    await this._upsertRollup(timestamp || new Date(), {
      $inc: { total_dwell_events: 1 },
      // avg updated via service-layer rolling average
    });

    return event.toObject();
  }

  async _handleQueueAlert({ event_type, camera_id, timestamp, payload, ai_meta }) {
    const depth = payload?.depth || 0;
    const QUEUE_THRESHOLD = parseInt(process.env.QUEUE_ALERT_THRESHOLD || '5');

    const is_alert = depth >= QUEUE_THRESHOLD;
    const event = new Event({
      event_type,
      camera_id,
      timestamp,
      ai_meta,
      is_alert,
      queue: {
        depth,
        wait_time_estimate_seconds: depth * 45, // ~45s per person heuristic
      },
    });
    await event.save();

    await this._upsertRollup(timestamp || new Date(), {
      $inc: { queue_alert_count: is_alert ? 1 : 0 },
      $max: { max_queue_depth: depth },
    });

    return event.toObject();
  }

  async _checkCrowdAlert(camera_id, timestamp) {
    const snapshot = await OccupancySnapshot.findOne({ store_id: 'main' });
    if (!snapshot) return null;

    const count = snapshot.current_count;
    if (count < OCCUPANCY_THRESHOLD) return null;

    const now = Date.now();
    const lastAlert = lastCrowdAlert.get('main') || 0;
    if (now - lastAlert < CROWD_COOLDOWN_MS) return null;

    lastCrowdAlert.set('main', now);

    const severity =
      count >= OCCUPANCY_THRESHOLD * 1.5 ? 'HIGH' :
      count >= OCCUPANCY_THRESHOLD * 1.2 ? 'MEDIUM' : 'LOW';

    const event = new Event({
      event_type: 'CROWD_ALERT',
      camera_id,
      timestamp: timestamp ? new Date(timestamp) : new Date(),
      is_alert: true,
      crowd: {
        current_count: count,
        threshold: OCCUPANCY_THRESHOLD,
        severity,
      },
      store_snapshot: { total_occupancy: count },
    });
    await event.save();

    getIO()?.emit('alert:crowd', {
      severity,
      current_count: count,
      threshold: OCCUPANCY_THRESHOLD,
      camera_id,
      timestamp: event.timestamp,
    });

    return event.toObject();
  }

  async _upsertRollup(ts, update) {
    const date = new Date(ts);
    const bucketStart = new Date(date);
    bucketStart.setMinutes(0, 0, 0);

    try {
      await AnalyticsRollup.findOneAndUpdate(
        { period: 'hour', bucket_start: bucketStart },
        { ...update, $inc: { ...update.$inc } },
        { upsert: true }
      );
    } catch (err) {
      logger.warn(`Rollup upsert failed: ${err.message}`);
    }
  }

  _emitEvent(eventObj) {
    try {
      getIO()?.emit('live:event', {
        id: eventObj._id,
        event_type: eventObj.event_type,
        camera_id: eventObj.camera_id,
        timestamp: eventObj.timestamp,
        is_alert: eventObj.is_alert,
        payload: {
          person: eventObj.person,
          dwell: eventObj.dwell,
          queue: eventObj.queue,
          crowd: eventObj.crowd,
        },
      });
    } catch (err) {
      logger.warn(`Socket emit failed: ${err.message}`);
    }
  }

  // ── Query methods ────────────────────────────────────────────────────────────

  async getRecentEvents({ limit = 50, event_type, camera_id, is_alert, since }) {
    const filter = {};
    if (event_type) filter.event_type = event_type;
    if (camera_id) filter.camera_id = camera_id;
    if (is_alert !== undefined) filter.is_alert = is_alert === 'true';
    if (since) filter.timestamp = { $gte: new Date(since) };

    // Validate `limit` coming from query params — protect against NaN / invalid values
    const parsed = Number.parseInt(limit, 10);
    const safeLimit = Number.isInteger(parsed) && parsed > 0 ? parsed : 50;

    return Event.find(filter)
      .sort({ timestamp: -1 })
      .limit(safeLimit)
      .lean();
  }

  async getLiveOccupancy() {
    let snapshot = await OccupancySnapshot.findOne({ store_id: 'main' }).lean();
    if (!snapshot) {
      snapshot = await OccupancySnapshot.create({ store_id: 'main' });
    }
    return snapshot;
  }
}

module.exports = new EventService();
