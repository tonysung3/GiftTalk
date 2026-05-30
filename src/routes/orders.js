const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');
const validate = require('../middleware/validate');
const schemas = require('../utils/validationSchemas');

/**
 * @swagger
 * /api/orders/history:
 *   get:
 *     summary: Get user's sent gift orders history
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of sent gift orders
 */
router.get('/history', auth, orderController.getMySentGiftOrders);

/**
 * @swagger
 * /api/orders/{id}:
 *   get:
 *     summary: Get order details by ID
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Order details
 */
router.get('/:id', auth, orderController.getOrderById);

/**
 * @swagger
 * /api/orders/admin/all:
 *   get:
 *     summary: Get all gift orders (Admin only)
 *     tags: [Orders Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of all gift orders
 */
router.get('/admin/all', auth, admin, orderController.getAllOrders);

/**
 * @swagger
 * /api/orders/admin/update-status:
 *   post:
 *     summary: Update order status (Admin only)
 *     tags: [Orders Admin]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - orderId
 *               - status
 *             properties:
 *               orderId:
 *                 type: integer
 *               status:
 *                 type: string
 *                 enum: [pending, processing, shipped, delivered, cancelled]
 *               trackingNumber:
 *                 type: string
 *     responses:
 *       200:
 *         description: Order status updated
 */
router.post('/admin/update-status', auth, admin, validate(schemas.orders.adminUpdateStatus), orderController.updateOrderStatus);

// Original for backward compatibility
router.get('/my-sent', auth, orderController.getMySentGiftOrders);

module.exports = router;
