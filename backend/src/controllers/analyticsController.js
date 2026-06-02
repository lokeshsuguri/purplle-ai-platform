const analyticsService = require('../services/analyticsService');

exports.getKPISummary = async (req, res, next) => {
  try {
    const data = await analyticsService.getKPISummary();
    res.json({ success: true, data });
  } catch (err) { next(err); }
};

exports.getHourlyFootfall = async (req, res, next) => {
  try {
    const hours = parseInt(req.query.hours) || 24;
    const data = await analyticsService.getHourlyFootfall(hours);
    res.json({ success: true, data });
  } catch (err) { next(err); }
};

exports.getDwellAnalytics = async (req, res, next) => {
  try {
    const data = await analyticsService.getDwellAnalytics(req.query.since);
    res.json({ success: true, data });
  } catch (err) { next(err); }
};

exports.getQueueTrend = async (req, res, next) => {
  try {
    const hours = parseInt(req.query.hours) || 8;
    const data = await analyticsService.getQueueTrend(hours);
    res.json({ success: true, data });
  } catch (err) { next(err); }
};

exports.getPeakHours = async (req, res, next) => {
  try {
    const days = parseInt(req.query.days) || 7;
    const data = await analyticsService.getPeakHours(days);
    res.json({ success: true, data });
  } catch (err) { next(err); }
};
