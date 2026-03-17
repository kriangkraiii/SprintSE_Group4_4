const express = require('express')
const asyncHandler = require('express-async-handler')
const { lookupProvince } = require('../services/thaiGeo.service')

const router = express.Router()

/**
 * GET /api/geo/lookup?lat=16.4467&lng=102.8347
 * Returns province info for a coordinate
 */
router.get('/lookup', asyncHandler(async (req, res) => {
    const lat = parseFloat(req.query.lat)
    const lng = parseFloat(req.query.lng)

    if (isNaN(lat) || isNaN(lng)) {
        return res.status(400).json({ success: false, message: 'lat and lng are required' })
    }

    const result = lookupProvince(lat, lng)
    res.json({
        success: true,
        data: result || { province_en: null, province_th: null }
    })
}))

module.exports = router
