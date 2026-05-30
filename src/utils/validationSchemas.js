const Joi = require('joi');

const schemas = {
    auth: {
        register: Joi.object({
            username: Joi.string().alphanum().min(3).max(30).required(),
            password: Joi.string().min(8).max(100).required(),
            display_name: Joi.string().max(50).optional()
        }),
        login: Joi.object({
            username: Joi.string().required(),
            password: Joi.string().required()
        })
    },
    gifts: {
        send: Joi.object({
            conversationId: Joi.number().integer().required(),
            giftId: Joi.number().integer().required(),
            recipientAddress: Joi.string().max(200).optional(),
            content: Joi.string().max(500).allow('', null).optional()
        }),
        adminAdd: Joi.object({
            name: Joi.string().max(100).required(),
            description: Joi.string().max(500).optional(),
            price_coins: Joi.number().integer().min(1).required(),
            image_url: Joi.string().uri().optional()
        }),
        adminUpdate: Joi.object({
            name: Joi.string().max(100).optional(),
            description: Joi.string().max(500).optional(),
            price_coins: Joi.number().integer().min(1).optional(),
            image_url: Joi.string().uri().optional()
        })
    },
    conversations: {
        create: Joi.object({
            participantId: Joi.number().integer().optional(),
            participantIds: Joi.array().items(Joi.number().integer()).optional(),
            name: Joi.string().max(100).optional(),
            avatarUrl: Joi.string().uri().optional(),
            is_group: Joi.boolean().default(false)
        }).or('participantId', 'participantIds')
    },
    payments: {
        createOrder: Joi.object({
            packId: Joi.number().integer().required()
        }),
        captureOrder: Joi.object({
            orderId: Joi.string().required(),
            packId: Joi.number().integer().required()
        })
    },
    users: {
        updateProfile: Joi.object({
            displayName: Joi.string().max(50).optional(),
            avatarUrl: Joi.string().uri().optional(),
            language: Joi.string().length(2).optional()
        }),
        updateAvatar: Joi.object({
            avatarUrl: Joi.string().uri().required()
        }),
        pushToken: Joi.object({
            token: Joi.string().required()
        })
    },
    coinPacks: {
        adminAdd: Joi.object({
            name: Joi.string().max(100).required(),
            coins: Joi.number().integer().min(1).required(),
            price_usd: Joi.number().min(0.01).required()
        }),
        adminUpdate: Joi.object({
            name: Joi.string().max(100).optional(),
            coins: Joi.number().integer().min(1).optional(),
            price_usd: Joi.number().min(0.01).optional()
        })
    },
    orders: {
        adminUpdateStatus: Joi.object({
            orderId: Joi.number().integer().required(),
            status: Joi.string().valid('pending', 'processing', 'shipped', 'delivered', 'cancelled').required(),
            trackingNumber: Joi.string().max(100).optional()
        })
    },
    sockets: {
        sendMessage: Joi.object({
            roomId: Joi.number().integer().required(),
            content: Joi.string().max(1000).required(),
            isGift: Joi.boolean().optional(),
            giftId: Joi.number().integer().optional(),
            recipientAddress: Joi.string().max(200).optional()
        }),
        markRead: Joi.object({
            roomId: Joi.number().integer().optional(),
            messageId: Joi.number().integer().optional()
        }).or('roomId', 'messageId'),
        typing: Joi.object({
            roomId: Joi.number().integer().required(),
            isTyping: Joi.boolean().required()
        })
    }
};

module.exports = schemas;
