const asyncHandler = require('express-async-handler');
const placeService = require('../services/place.service');

// ─── Saved Places ─────────────────────────────────────────

const getSavedPlaces = asyncHandler(async (req, res) => {
    const places = await placeService.getSavedPlaces(req.user.id);
    res.json(places);
});

const upsertSavedPlace = asyncHandler(async (req, res) => {
    const place = await placeService.upsertSavedPlace(req.user.id, req.body);
    res.status(201).json(place);
});

const deleteSavedPlace = asyncHandler(async (req, res) => {
    await placeService.deleteSavedPlace(req.user.id, req.params.id);
    res.json({ message: 'Deleted successfully' });
});

// ─── Recent Searches ──────────────────────────────────────

const getRecentSearches = asyncHandler(async (req, res) => {
    const limit = req.query.limit || 10;
    const recent = await placeService.getRecentSearches(req.user.id, limit);
    res.json(recent);
});

const addRecentSearch = asyncHandler(async (req, res) => {
    const search = await placeService.addRecentSearch(req.user.id, req.body);
    res.status(201).json(search);
});

const clearRecentSearches = asyncHandler(async (req, res) => {
    const result = await placeService.clearRecentSearches(req.user.id);
    res.json(result);
});

module.exports = {
    getSavedPlaces,
    upsertSavedPlace,
    deleteSavedPlace,
    getRecentSearches,
    addRecentSearch,
    clearRecentSearches,
};
