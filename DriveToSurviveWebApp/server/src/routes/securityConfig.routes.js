/**
 * Admin Security Config Routes
 * Toggle security features at runtime (Rate Limit, Profanity Filter, etc.)
 */
const express = require('express');
const { protect, requireAdmin } = require('../middlewares/auth');
const { getConfig, updateConfig } = require('../utils/securityConfig');

const router = express.Router();

// GET /security-config — get current config
router.get('/', protect, requireAdmin, (req, res) => {
  res.json({ success: true, data: getConfig() });
});

// PATCH /security-config — update config
router.patch('/', protect, requireAdmin, (req, res) => {
  const updated = updateConfig(req.body);
  res.json({ success: true, data: updated, message: 'อัปเดตการตั้งค่าความปลอดภัยแล้ว' });
});

module.exports = router;
