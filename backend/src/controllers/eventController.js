const { validationResult } = require('express-validator');
const eventService = require('../services/eventService');
const logger = require('../utils/logger');

exports.ingestEvents = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ success: false, errors: errors.array() });
    }

    // Accept either a single detection or an array (batch)
    const detections = Array.isArray(req.body) ? req.body : [req.body];
    const saved = await eventService.ingestBatch(detections);

    res.status(201).json({ success: true, count: saved.length, events: saved });
  } catch (err) {
    next(err);
  }
};

exports.getEvents = async (req, res, next) => {
  try {
    const events = await eventService.getRecentEvents(req.query);
    res.json({ success: true, count: events.length, events });
  } catch (err) {
    next(err);
  }
};

exports.getLiveOccupancy = async (req, res, next) => {
  try {
    const occupancy = await eventService.getLiveOccupancy();
    res.json({ success: true, data: occupancy });
  } catch (err) {
    next(err);
  }
};
