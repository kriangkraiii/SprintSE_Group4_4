/**
 * @swagger
 * tags:
 *   name: SystemLogs
 *   description: System activity logs (Computer Crime Act B.E. 2560 §26)
 */

/**
 * @swagger
 * /api/system-logs:
 *   get:
 *     summary: Search system logs (Admin only)
 *     tags: [SystemLogs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 50 }
 *       - in: query
 *         name: userId
 *         schema: { type: string }
 *       - in: query
 *         name: ipAddress
 *         schema: { type: string }
 *       - in: query
 *         name: action
 *         schema: { type: string, enum: [GET, POST, PUT, PATCH, DELETE] }
 *       - in: query
 *         name: createdFrom
 *         schema: { type: string, format: date-time }
 *       - in: query
 *         name: createdTo
 *         schema: { type: string, format: date-time }
 *     responses:
 *       200:
 *         description: Logs retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Admin access required
 */
