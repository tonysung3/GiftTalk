const { initializeDatabase } = require('../src/models/schema');

console.log('Starting database initialization...');
try {
    initializeDatabase();
    console.log('Database initialization completed.');
    process.exit(0);
} catch (error) {
    console.error('Database initialization failed:', error);
    process.exit(1);
}
