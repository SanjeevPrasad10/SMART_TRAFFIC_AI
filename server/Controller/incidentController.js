const Incident = require('../Models/Incident');
const { analyzeIncident } = require('../services/geminiServices');

// @desc    Report a new traffic incident (Citizens)
// @route   POST /api/incidents
// @access  Private (Authenticated users)
exports.createIncident = async (req, res) => {
    try {
        const { title, description, longitude, latitude, address } = req.body;

        if (!title || !description) {
            return res.status(400).json({ success: false, message: 'Please provide title and description' });
        }

        if (!longitude || !latitude) {
            return res.status(400).json({ success: false, message: 'GPS coordinates (longitude, latitude) are required' });
        }

        // Image file details if uploaded
        let imageUrl = null;
        let imagePath = null;
        let mimeType = null;

        if (req.file) {
            imageUrl = `/uploads/${req.file.filename}`;
            imagePath = req.file.path;
            mimeType = req.file.mimetype;
        }

        console.log(`🤖 Triggering Gemini AI Vision Analysis for: "${title}"...`);

        // 1. Run Gemini Multimodal AI Analysis
        const aiResult = await analyzeIncident(imagePath, mimeType, description);

        console.log(`✅ Gemini Analysis Complete! Detected: [${aiResult.detectedSeverity}] - ${aiResult.detectedType}`);

        // 2. Identify reporter (authenticated user or fallback citizen)
        let reporterId = req.user?._id;
        if (!reporterId) {
            const User = require('../Models/users');
            let defaultUser = await User.findOne({ role: 'citizen' });
            if (!defaultUser) {
                defaultUser = await User.create({
                    name: 'Civic Reporter',
                    email: 'citizen@smarttraffic.com',
                    password: 'password123',
                    role: 'citizen'
                });
            }
            reporterId = defaultUser._id;
        }

        // 3. Save Incident to MongoDB with GeoJSON and AI Output
        const incident = await Incident.create({
            title,
            description,
            reportedBy: reporterId,
            imageUrl,
            incidentType: aiResult.detectedType || 'other',
            severity: aiResult.detectedSeverity || 'MEDIUM',
            status: 'REPORTED',
            location: {
                type: 'Point',
                coordinates: [parseFloat(longitude), parseFloat(latitude)], // [lng, lat]
                address: address || ''
            },
            aiAnalysis: {
                analyzedAt: new Date(),
                detectedSeverity: aiResult.detectedSeverity,
                detectedType: aiResult.detectedType,
                summary: aiResult.summary,
                recommendedActions: aiResult.recommendedActions,
                confidenceScore: aiResult.confidenceScore
            }
        });

        // 3. Broadcast real-time WebSocket alert to authorities and live map
        const io = req.app.get('io');
        if (io) {
            // Push alert immediately to the authorities room
            io.to('authorities').emit('new_incident', incident);

            // Also broadcast to public live map feed
            io.emit('incident_feed_update', {
                type: 'NEW_INCIDENT',
                incident
            });
            console.log(`📡 Broadcasted new incident alert over WebSocket: ${incident._id}`);
        }

        res.status(201).json({
            success: true,
            message: 'Incident reported and analyzed successfully!',
            incident
        });

    } catch (error) {
        console.error('❌ Error creating incident:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get all incidents (with filters for status & severity)
// @route   GET /api/incidents
// @access  Public
exports.getIncidents = async (req, res) => {
    try {
        const { status, severity, incidentType } = req.query;
        let query = {};

        if (status) query.status = status;
        if (severity) query.severity = severity;
        if (incidentType) query.incidentType = incidentType;

        const incidents = await Incident.find(query)
            .populate('reportedBy', 'name email phone')
            .populate('assignedAuthority', 'name badgeNumber')
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: incidents.length,
            incidents
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get nearby incidents using Geospatial radius
// @route   GET /api/incidents/nearby?lng=...&lat=...&radius=5000 (in meters)
// @access  Public
exports.getNearbyIncidents = async (req, res) => {
    try {
        const { lng, lat, radius = 5000 } = req.query; // Default 5 km radius

        if (!lng || !lat) {
            return res.status(400).json({ success: false, message: 'Please provide longitude and latitude query parameters' });
        }

        // MongoDB Geospatial $nearSphere Query (Sub-5ms!)
        const incidents = await Incident.find({
            location: {
                $nearSphere: {
                    $geometry: {
                        type: 'Point',
                        coordinates: [parseFloat(lng), parseFloat(lat)]
                    },
                    $maxDistance: parseInt(radius) // Distance in meters
                }
            }
        }).populate('reportedBy', 'name');

        res.status(200).json({
            success: true,
            count: incidents.length,
            radiusInMeters: radius,
            incidents
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Update incident status (Authorities / Admin only)
// @route   PATCH /api/incidents/:id/status
// @access  Private (authority, admin)
exports.updateIncidentStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const validStatuses = ['REPORTED', 'INVESTIGATING', 'DISPATCHED', 'RESOLVED', 'REJECTED'];

        if (!validStatuses.includes(status)) {
            return res.status(400).json({ success: false, message: `Invalid status. Choose from: ${validStatuses.join(', ')}` });
        }

        // Identify authority (authenticated user or fallback authority)
        let authorityId = req.user?._id;//Type coercion
        if (!authorityId) {
            const User = require('../Models/users');
            let authorityUser = await User.findOne({ role: 'authority' });
            if (!authorityUser) {
                authorityUser = await User.create({
                    name: 'Officer Vikram Singh',
                    email: 'authority@smarttraffic.com',
                    password: 'password123',
                    role: 'authority',
                    badgeNumber: 'UK-TR-402'
                });
            }
            authorityId = authorityUser._id;
        }

        const incident = await Incident.findByIdAndUpdate(
            req.params.id,
            { 
                status,
                assignedAuthority: authorityId 
            },
            { new: true, runValidators: true }
        );

        if (!incident) {
            return res.status(404).json({ success: false, message: 'Incident not found' });
        }

        // Broadcast karega status update real time mai over WebSocket
        const io = req.app.get('io');
        if (io) {
            io.emit('incident_status_updated', {
                incidentId: incident._id,
                status: incident.status,
                assignedAuthority: authorityId,
                updatedAt: new Date(),
                incident
            });
            console.log(`📡 Broadcasted status update over WebSocket for incident: ${incident._id} -> ${status}`);
        }

        res.status(200).json({
            success: true,
            message: `Incident status updated to ${status}`,
            incident
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
