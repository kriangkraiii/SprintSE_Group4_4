/**
 * @swagger
 * tags:
 *   name: Blacklist
 *   description: Blacklist management (PDPA B.E. 2562 §22 — SHA-256 Hash only)
 */

/**
 * @swagger
 * /api/blacklist:
 *   get:
 *     summary: Search blacklist entries (Admin only)
 *     tags: [Blacklist]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer }
 *       - in: query
 *         name: limit
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Blacklist entries retrieved
 *
 *   post:
 *     summary: Add National ID to blacklist (Admin only)
 *     tags: [Blacklist]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [nationalId]
 *             properties:
 *               nationalId:
 *                 type: string
 *                 description: Raw 13-digit Thai National ID (will be stored as SHA-256 hash)
 *               reason:
 *                 type: string
 *     responses:
 *       201:
 *         description: Added to blacklist
 *       409:
 *         description: Already in blacklist
 *
 * /api/blacklist/{id}:
 *   delete:
 *     summary: Remove from blacklist (Admin only)
 *     tags: [Blacklist]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Removed from blacklist
 *
 * /api/blacklist/check:
 *   post:
 *     summary: Check if National ID is blacklisted
 *     tags: [Blacklist]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [nationalId]
 *             properties:
 *               nationalId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Check result
 */
