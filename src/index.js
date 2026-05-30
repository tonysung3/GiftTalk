require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');
const { rateLimit } = require('express-rate-limit');
const { initializeDatabase, db } = require('./models/schema');
const pkg = require('../package.json');

const app = express();
const server = http.createServer(app);

// Sockets setup
const io = new Server(server, {
    cors: {
        origin: process.env.CORS_ORIGIN || '*',
        methods: ['GET', 'POST']
    }
});
app.set('io', io);

// Swagger Documentation
require('./config/swagger')(app);

// Security Middleware
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            imgSrc: ["'self'", "data:", "https:"],
            connectSrc: ["'self'", "https:", "wss:"],
            fontSrc: ["'self'", "https:", "data:"],
            objectSrc: ["'none'"],
            mediaSrc: ["'self'"],
            frameSrc: ["'none'"],
        },
    },
    crossOriginEmbedderPolicy: true,
    crossOriginOpenerPolicy: true,
    crossOriginResourcePolicy: { policy: "same-site" },
    dnsPrefetchControl: { allow: false },
    frameguard: { action: "deny" },
    hsts: { maxAge: 31536000, includeSubDomains: true, preload: true },
    ieNoOpen: true,
    noSniff: true,
    originAgentCluster: true,
    permittedCrossDomainPolicies: { permittedPolicies: "none" },
    referrerPolicy: { policy: "no-referrer" },
    xssFilter: true,
}));

const corsOptions = {
    origin: process.env.NODE_ENV === 'production' 
        ? (process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : false)
        : '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
};
app.use(cors(corsOptions));

// Body parsing with limits
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    limit: 100,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
});

const authLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    limit: 10, // Limit each IP to 10 requests per hour for auth
    message: { error: 'Too many requests, please try again after an hour' },
    standardHeaders: 'draft-7',
    legacyHeaders: false,
});

const paymentLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    limit: 20, // Limit each IP to 20 requests per hour for payments
    message: { error: 'Too many payment requests, please try again later' },
    standardHeaders: 'draft-7',
    legacyHeaders: false,
});

const giftLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    limit: 50, // Limit each IP to 50 gifts per 15 minutes
    message: { error: 'Too many gift requests, please try again later' },
    standardHeaders: 'draft-7',
    legacyHeaders: false,
});

app.use('/api/', generalLimiter);
app.use('/api/auth/', authLimiter);
app.use('/api/payments/', paymentLimiter);
app.use('/api/gifts/send', giftLimiter);

app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// Initialize Database
initializeDatabase();

// Enhanced Health check
app.get('/health', (req, res) => {
    let dbStatus = 'ok';
    try {
        db.prepare('SELECT 1').get();
    } catch (err) {
        dbStatus = 'error';
    }

    res.json({
        status: 'ok',
        version: pkg.version,
        uptime: process.uptime(),
        database: dbStatus,
        timestamp: new Date().toISOString()
    });
});

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/gifts', require('./routes/gifts'));
app.use('/api/coin-packs', require('./routes/coinPacks'));
app.use('/api/payments', require('./routes/payments'));
app.use('/api/users', require('./routes/users'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/conversations', require('./routes/conversations'));
app.use('/api/admin', require('./routes/admin'));

// Sockets
require('./sockets/chat')(io);
// Seed endpoint
app.get('/api/seed', (req, res) => {
    try {
        const gifts = [
            { name:'Red Rose', desc:'A beautiful red rose', price:10, emoji:'🌹' },
            { name:'Chocolate Box', desc:'Premium assorted chocolates', price:20, emoji:'🍫' },
            { name:'Teddy Bear', desc:'Soft plush teddy bear', price:50, emoji:'🧸' },
            { name:'Birthday Cake', desc:'Celebration cake', price:100, emoji:'🎂' },
            { name:'Coffee Gift Set', desc:'Premium coffee bundle', price:30, emoji:'☕' },
            { name:'Flower Bouquet', desc:'Mixed flower bouquet', price:40, emoji:'💐' },
            { name:'Wine Bottle', desc:'Fine red wine', price:75, emoji:'🍷' },
            { name:'Spa Package', desc:'Relaxation spa kit', price:150, emoji:'💆' },
            { name:'Scented Candle', desc:'Luxury scented candle', price:15, emoji:'🕯️' },
            { name:'Jewelry Box', desc:'Elegant jewelry box', price:200, emoji:'💍' }
        ];
        const insertGift = db.prepare('INSERT OR IGNORE INTO gifts (name, description, price_coins, image_url) VALUES (?, ?, ?, ?)');
        gifts.forEach(g => insertGift.run(g.name, g.desc, g.price, g.emoji));

        const packs = [
            { name:'Starter Pack', coins:100, price:2.99 },
            { name:'Popular Pack', coins:500, price:9.99 },
            { name:'Mega Pack', coins:1200, price:19.99 },
            { name:'Ultimate Pack', coins:3000, price:39.99 }
        ];
        const insertPack = db.prepare('INSERT OR IGNORE INTO coin_packs (name, coins, price_usd) VALUES (?, ?, ?)');
        packs.forEach(p => insertPack.run(p.name, p.coins, p.price));

        res.json({ success: true, gifts: db.prepare('SELECT COUNT(*) as c FROM gifts').get().c, coinPacks: db.prepare('SELECT COUNT(*) as c FROM coin_packs').get().c });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.use((req, res) => {
    res.status(404).json({ error: 'Not Found' });
});

// Global Error Handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    const status = err.status || 500;
    const message = process.env.NODE_ENV === 'production' 
        ? 'Internal Server Error' 
        : err.message;
    
    res.status(status).json({ 
        error: message,
        ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
    });
});

const PORT = process.env.PORT || 3000;
if (process.env.NODE_ENV !== 'test') {
    server.listen(PORT, '0.0.0.0', () => {
        console.log(`Server is running on http://0.0.0.0:${PORT}`);
    });
}

module.exports = app;
