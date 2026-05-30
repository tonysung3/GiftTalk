const express = require('express');
const router = express.Router();
const conversationController = require('../controllers/conversationController');
const auth = require('../middleware/auth');
const validate = require('../middleware/validate');
const schemas = require('../utils/validationSchemas');

/**
 * @swagger
 * /api/conversations:
 *   get:
 *     summary: List all user's conversations
 *     tags: [Conversations]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of conversations with last message preview
 */
router.get('/', auth, conversationController.getConversations);

/**
 * @swagger
 * /api/conversations/{id}:
 *   get:
 *     summary: Get conversation details with participants
 *     tags: [Conversations]
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
 *         description: Conversation details
 */
router.get('/:id', auth, conversationController.getConversationById);

/**
 * @swagger
 * /api/conversations:
 *   post:
 *     summary: Create or get a 1-on-1 or group conversation
 *     tags: [Conversations]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               participantId:
 *                 type: integer
 *               participantIds:
 *                 type: array
 *                 items:
 *                   type: integer
 *               name:
 *                 type: string
 *               avatarUrl:
 *                 type: string
 *     responses:
 *       201:
 *         description: Conversation created or existing one returned
 */
router.post('/', auth, validate(schemas.conversations.create), conversationController.createConversation);

/**
 * @swagger
 * /api/conversations/group:
 *   post:
 *     summary: Create a group conversation (Legacy endpoint, use POST /api/conversations instead)
 *     tags: [Conversations]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - participantIds
 *             properties:
 *               name:
 *                 type: string
 *               participantIds:
 *                 type: array
 *                 items:
 *                   type: integer
 *               avatarUrl:
 *                 type: string
 *     responses:
 *       201:
 *         description: Group created
 */
router.post('/group', auth, validate(schemas.conversations.create), conversationController.createConversation);

/**
 * @swagger
 * /api/conversations/{id}/messages:
 *   get:
 *     summary: Get message history for a conversation
 *     tags: [Conversations]
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
 *         description: List of messages
 */
router.get('/:id/messages', auth, conversationController.getMessages);

/**
 * @swagger
 * /api/conversations/{id}/participants:
 *   get:
 *     summary: Get participants of a conversation
 *     tags: [Conversations]
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
 *         description: List of participants
 */
router.get('/:id/participants', auth, conversationController.getParticipants);

module.exports = router;
