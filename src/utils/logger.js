const { db } = require('../models/schema');

/**
 * Log an event to the database for analytics.
 * @param {number|null} userId - The ID of the user who triggered the event.
 * @param {string} eventType - The type of event (e.g., 'gift_send').
 * @param {object} eventData - Optional metadata for the event.
 */
function logEvent(userId, eventType, eventData = {}) {
    try {
        const stmt = db.prepare('INSERT INTO event_logs (user_id, event_type, event_data) VALUES (?, ?, ?)');
        stmt.run(userId, eventType, JSON.stringify(eventData));
    } catch (error) {
        console.error('Failed to log event:', error);
    }
}

module.exports = {
    logEvent
};
