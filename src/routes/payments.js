const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const auth = require('../middleware/auth');
const validate = require('../middleware/validate');
const schemas = require('../utils/validationSchemas');

/**
 * @swagger
 * /api/payments/create-order:
 *   post:
 *     summary: Create a PayPal order for a coin pack
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - packId
 *             properties:
 *               packId:
 *                 type: integer
 *     responses:
 *       200:
 *         description: PayPal order created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 */
router.post('/create-order', auth, validate(schemas.payments.createOrder), paymentController.createPayPalOrder);

/**
 * @swagger
 * /api/payments/capture-order:
 *   post:
 *     summary: Capture a PayPal order and credit coins
 *     tags: [Payments]
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
 *               - packId
 *             properties:
 *               orderId:
 *                 type: string
 *               packId:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Payment captured and coins credited
 */
router.post('/capture-order', auth, validate(schemas.payments.captureOrder), paymentController.capturePayPalOrder);

module.exports = router;
