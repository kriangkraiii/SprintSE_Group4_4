const express = require('express');
const { protect } = require('../middlewares/auth');
const placeController = require('../controllers/place.controller');

const router = express.Router();

// All routes require authentication
router.use(protect);

// ─── Saved Places ─────────────────────────────────────────
router.get('/saved', placeController.getSavedPlaces);
router.post('/saved', placeController.upsertSavedPlace);
router.delete('/saved/:id', placeController.deleteSavedPlace);

// ─── Recent Searches ──────────────────────────────────────
router.get('/recent', placeController.getRecentSearches);
router.post('/recent', placeController.addRecentSearch);
router.delete('/recent', placeController.clearRecentSearches);

module.exports = router;
