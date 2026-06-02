// cameraRoutes.js
const router = require('express').Router();
const ctrl = require('../controllers/cameraController');

router.get('/',              ctrl.getAllCameras);
router.patch('/:id/status',  ctrl.updateCameraStatus);
router.get('/:id/stats',     ctrl.getCameraStats);

module.exports = router;
