const router = require('express').Router();
const { body } = require('express-validator');
const ctrl = require('../controllers/eventController');

const ingestValidation = [
  body('*.event_type').isIn(['ENTRY', 'EXIT', 'DWELL_TIME', 'QUEUE_ALERT', 'CROWD_ALERT']),
  body('*.camera_id').isIn(['CAM1', 'CAM2', 'CAM3', 'CAM4', 'CAM5']),
];

// POST /api/events/ingest  — AI service calls this
router.post('/ingest', ingestValidation, ctrl.ingestEvents);

// GET  /api/events         — dashboard event log
router.get('/', ctrl.getEvents);

// GET  /api/events/occupancy — live occupancy
router.get('/occupancy', ctrl.getLiveOccupancy);

module.exports = router;
