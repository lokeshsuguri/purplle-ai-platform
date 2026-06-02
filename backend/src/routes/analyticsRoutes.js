const router = require('express').Router();
const ctrl = require('../controllers/analyticsController');

router.get('/kpi',         ctrl.getKPISummary);
router.get('/footfall',    ctrl.getHourlyFootfall);
router.get('/dwell',       ctrl.getDwellAnalytics);
router.get('/queue',       ctrl.getQueueTrend);
router.get('/peak-hours',  ctrl.getPeakHours);

module.exports = router;
