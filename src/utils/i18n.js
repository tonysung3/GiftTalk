const { db } = require('../models/schema');

// Static translations for UI strings if needed by backend (e.g. email notifications, system messages)
const translations = {
    en: {
        welcome: 'Welcome to GiftTalk!',
        gift_sent: 'You sent a gift: {{giftName}}',
        insufficient_coins: 'Insufficient coins.'
    },
    es: {
        welcome: '¡Bienvenido a GiftTalk!',
        gift_sent: 'Enviaste un regalo: {{giftName}}',
        insufficient_coins: 'Monedas insuficientes.'
    },
    fr: {
        welcome: 'Bienvenue sur GiftTalk !',
        gift_sent: 'Vous avez envoyé un cadeau : {{giftName}}',
        insufficient_coins: 'Pièces insuffisantes.'
    }
};

/**
 * Get translated content for a gift.
 * @param {number} giftId 
 * @param {string} locale 
 * @returns {object|null}
 */
function getGiftTranslation(giftId, locale) {
    return db.prepare('SELECT name, description FROM gift_translations WHERE gift_id = ? AND locale = ?')
        .get(giftId, locale);
}

/**
 * Translate a static key.
 */
function t(key, locale = 'en', replacements = {}) {
    let text = (translations[locale] && translations[locale][key]) || translations['en'][key] || key;
    
    for (const [k, v] of Object.entries(replacements)) {
        text = text.replace(`{{${k}}}`, v);
    }
    
    return text;
}

module.exports = {
    t,
    getGiftTranslation
};
