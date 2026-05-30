const express = require('express');
const router = express.Router();
const coinController = require('../controllers/coinController');
const userController = require('../controllers/userController');
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');
const validate = require('../middleware/validate');
const schemas = require('../utils/validationSchemas');

/**
 * @swagger
 * /api/users/coins:
 *   get:
 *     summary: Get current user's coin balance
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Current coin balance
 */
router.get('/coins', auth, coinController.getBalance);

/**
 * @swagger
 * /api/users/search:
 *   get:
 *     summary: Search for users by username
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *         description: Search query
 *     responses:
 *       200:
 *         description: List of matching users
 */
router.get('/search', auth, userController.searchUsers);

/**
 * @swagger
 * /api/users/push-token:
 *   post:
 *     summary: Register device push token
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *             properties:
 *               token:
 *                 type: string
 *     responses:
 *       200:
 *         description: Token registered successfully
 */
router.post('/push-token', auth, validate(schemas.users.pushToken), (req, res) => {
    const { token } = req.body;
    try {
        const { db } = require('../models/schema');
        console.log(`[Push] User ${req.user.id} registered device token`);
        res.json({ message: 'Token registered successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * @swagger
 * /api/users/profile:
 *   get:
 *     summary: Get current user's profile
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile
 */
router.get('/profile', auth, userController.getProfile);

/**
 * @swagger
 * /api/users/profile:
 *   put:
 *     summary: Update current user's profile
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               displayName:
 *                 type: string
 *               avatarUrl:
 *                 type: string
 *     responses:
 *       200:
 *         description: Profile updated successfully
 */
router.put('/profile', auth, validate(schemas.users.updateProfile), userController.updateProfile);

/**
 * @swagger
 * /api/users/avatar:
 *   put:
 *     summary: Update current user's avatar
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - avatarUrl
 *             properties:
 *               avatarUrl:
 *                 type: string
 *     responses:
 *       200:
 *         description: Avatar updated successfully
 */
router.put('/avatar', auth, validate(schemas.users.updateAvatar), userController.updateAvatar);

/**
 * @swagger
 * /api/users/admin/all:
 *   get:
 *     summary: List all users (Admin only)
 *     tags: [Users Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of all users
 */
router.get('/admin/all', auth, admin, userController.getAllUsers);

module.exports = router;
