// occupancyRoutes.js
const router = require('express').Router();
const eventController = require('../controllers/eventController');

router.get('/live', eventController.getLiveOccupancy);

module.exports = router;
