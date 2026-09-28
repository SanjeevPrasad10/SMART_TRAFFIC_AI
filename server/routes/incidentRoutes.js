const express = require('express');
const router = express.Router();
const {
    createIncident,
    getIncidents,
    getNearbyIncidents,
    updateIncidentStatus
} = require('../Controller/incidentController');

const { protect, optionalProtect, authorize } = require('../Middleware/auth');
const upload = require('../Middleware/upload');

// Public route: View nearby incidents on map
router.get('/nearby', getNearbyIncidents);

// Public route: Get all incidents with filters
router.get('/', getIncidents);

// Citizen route: Citizens can report incidents with or without login
router.post('/', optionalProtect, upload.single('image'), createIncident);

// Authority route: Authorities update incident status (supports demo authority if unauthenticated)
router.patch('/:id/status', optionalProtect, updateIncidentStatus);

module.exports = router;
