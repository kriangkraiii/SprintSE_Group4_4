const express = require('express');
const { protect, requireAdmin } = require('../middlewares/auth');
const validate = require('../middlewares/validate');
const {
    addBlacklistSchema,
    checkBlacklistSchema,
    searchBlacklistSchema,
} = require('../validations/blacklist.validation');
const blacklistController = require('../controllers/blacklist.controller');

const router = express.Router();

// Admin-only CRUD
router.get('/', protect, requireAdmin, validate({ query: searchBlacklistSchema }), blacklistController.getBlacklist);
router.post('/', protect, requireAdmin, validate({ body: addBlacklistSchema }), blacklistController.addToBlacklist);
router.delete('/:id', protect, requireAdmin, blacklistController.removeFromBlacklist);

// Internal check (protected, not admin-only so registration flow can use it)
router.post('/check', protect, validate({ body: checkBlacklistSchema }), blacklistController.checkBlacklist);

module.exports = router;
