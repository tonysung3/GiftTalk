const express = require('express');
const router = express.Router();
const coinController = require('../controllers/coinController');
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');
const validate = require('../middleware/validate');
const schemas = require('../utils/validationSchemas');

/**
 * @swagger
 * /api/coin-packs:
 *   get:
 *     summary: List available coin packs
 *     tags: [Coins]
 *     responses:
 *       200:
 *         description: A list of coin packs
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                   name:
 *                     type: string
 *                   coins:
 *                     type: integer
 *                   price_usd:
 *                     type: number
 */
router.get('/', coinController.getCoinPacks);

/**
 * @swagger
 * /api/coin-packs/admin:
 *   post:
 *     summary: Add a new coin pack (Admin only)
 *     tags: [Coins Admin]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               coins:
 *                 type: integer
 *               price_usd:
 *                 type: number
 *     responses:
 *       201:
 *         description: Coin pack added successfully
 */
router.post('/admin', auth, admin, validate(schemas.coinPacks.adminAdd), coinController.addCoinPack);

/**
 * @swagger
 * /api/coin-packs/admin/{id}:
 *   put:
 *     summary: Update a coin pack (Admin only)
 *     tags: [Coins Admin]
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
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               coins:
 *                 type: integer
 *               price_usd:
 *                 type: number
 *     responses:
 *       200:
 *         description: Coin pack updated successfully
 */
router.put('/admin/:id', auth, admin, validate(schemas.coinPacks.adminUpdate), coinController.updateCoinPack);

/**
 * @swagger
 * /api/coin-packs/admin/{id}:
 *   delete:
 *     summary: Delete a coin pack (Admin only)
 *     tags: [Coins Admin]
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
 *         description: Coin pack deleted successfully
 */
router.delete('/admin/:id', auth, admin, coinController.deleteCoinPack);

module.exports = router;
