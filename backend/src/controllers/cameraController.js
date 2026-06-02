const Camera = require('../models/Camera');
const Event = require('../models/Event');

exports.getAllCameras = async (req, res, next) => {
  try {
    const cameras = await Camera.find().lean();
    res.json({ success: true, data: cameras });
  } catch (err) { next(err); }
};

exports.updateCameraStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const camera = await Camera.findOneAndUpdate(
      { camera_id: id },
      { $set: { status, last_heartbeat: new Date() } },
      { new: true }
    );
    if (!camera) return res.status(404).json({ success: false, message: 'Camera not found' });
    res.json({ success: true, data: camera });
  } catch (err) { next(err); }
};

exports.getCameraStats = async (req, res, next) => {
  try {
    const { id } = req.params;
    const since = new Date(Date.now() - 24 * 3600 * 1000);

    const [totalEvents, alertEvents] = await Promise.all([
      Event.countDocuments({ camera_id: id, timestamp: { $gte: since } }),
      Event.countDocuments({ camera_id: id, is_alert: true, timestamp: { $gte: since } }),
    ]);

    res.json({ success: true, data: { camera_id: id, events_24h: totalEvents, alerts_24h: alertEvents } });
  } catch (err) { next(err); }
};
