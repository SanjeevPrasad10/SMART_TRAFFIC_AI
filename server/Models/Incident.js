const express = require('express');
const mongoose = require('mongoose');

const IncidentSchema = mongoose.Schema({

    title:{
        type:String,
        required: true,
        trim:true
    },

    description:{
        type:String,
        required:true,
    },

    reportedBy:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'User',
        required:true
    },

    assignedAuthority:{
        type:mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },

    incidentType:{
        type:String,
        enum: ['accident', 'traffic_jam', 'road_damage', 'signal_failure', 'illegal_parking', 'hazard', 'other'],
        default: 'other'
    },

    severity: {
        type: String,
        enum: ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'PENDING_AI'],
        default: 'PENDING_AI'
    },

    status: {
        type: String,
        enum: ['REPORTED', 'INVESTIGATING', 'DISPATCHED', 'RESOLVED', 'REJECTED'],
        default: 'REPORTED'
    },

    imageUrl: {
        type: String,
        default: null
    },

    location:{
        type:{
            type:String,
            enum: ['Point'],
            default: 'Point'
        },
        coordinates:{
            type:[Number],
            required:true
        }
    },

        aiAnalysis: {
        analyzedAt: Date,
        detectedSeverity: String,
        detectedType: String,
        summary: String,
        recommendedActions: [String],
        confidenceScore: Number
    }

},{ timestamps:true })

IncidentSchema.index({ location: '2dsphere' })
module.exports = mongoose.model('Incident',IncidentSchema)