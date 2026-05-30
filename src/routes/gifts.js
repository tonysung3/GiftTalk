const express = require('express');
const router = express.Router();
const giftController = require('../controllers/giftController');
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');
const validate = require('../middleware/validate');
const schemas = require('../utils/validationSchemas');

/**
 * @swagger
 * components:
 *   schemas:
 *     Gift:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         name:
 *           type: string
 *         description:
 *           type: string
 *         price_coins:
 *           type: integer
 *         image_url:
 *           type: string
 */

/**
 * @swagger
 * /api/gifts:
 *   get:
 *     summary: List all gifts in the catalog
 *     tags: [Gifts]
 *     responses:
 *       200:
 *         description: A list of gifts
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Gift'
 */
router.get('/', giftController.getAllGifts);

/**
 * @swagger
 * /api/gifts/send:
 *   post:
 *     summary: Send a gift in a chat
 *     tags: [Gifts]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - conversationId
 *               - giftId
 *             properties:
 *               conversationId:
 *                 type: integer
 *               giftId:
 *                 type: integer
 *               content:
 *                 type: string
 *               recipientAddress:
 *                 type: string
 *     responses:
 *       200:
 *         description: Gift sent successfully
 *       400:
 *         description: Insufficient coins or invalid data
 */
router.post('/send', auth, validate(schemas.gifts.send), giftController.sendGift);

/**
 * @swagger
 * /api/gifts/admin:
 *   post:
 *     summary: Add a new gift (Admin only)
 *     tags: [Gifts Admin]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Gift'
 *     responses:
 *       201:
 *         description: Gift added successfully
 */
router.post('/admin', auth, admin, validate(schemas.gifts.adminAdd), giftController.addGift);

/**
 * @swagger
 * /api/gifts/admin/{id}:
 *   put:
 *     summary: Update a gift (Admin only)
 *     tags: [Gifts Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Gift'
 *     responses:
 *       200:
 *         description: Gift updated successfully
 */
router.put('/admin/:id', auth, admin, validate(schemas.gifts.adminUpdate), giftController.updateGift);

/**
 * @swagger
 * /api/gifts/admin/{id}:
 *   delete:
 *     summary: Delete a gift (Admin only)
 *     tags: [Gifts Admin]
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
 *         description: Gift deleted successfully
 */
router.delete('/admin/:id', auth, admin, giftController.deleteGift);

// Compatibility routes (no Swagger for these to keep it clean)
router.post('/admin/add', auth, admin, giftController.addGift);
router.put('/admin/update/:id', auth, admin, giftController.updateGift);
router.delete('/admin/delete/:id', auth, admin, giftController.deleteGift);

module.exports = router;
