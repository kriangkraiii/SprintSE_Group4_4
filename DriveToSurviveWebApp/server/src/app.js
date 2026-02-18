require("dotenv").config({
    path: require('path').resolve(__dirname, '../../.env'),
    quiet: true,
});

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
// const rateLimit = require('express-rate-limit');
const promClient = require('prom-client');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./config/swagger');
const routes = require('./routes');
const { errorHandler } = require('./middlewares/errorHandler');
const ApiError = require('./utils/ApiError');
const { metricsMiddleware } = require('./middlewares/metrics');
const systemLogMiddleware = require('./middlewares/systemLog.middleware');
const ensureAdmin = require('./bootstrap/ensureAdmin');

const app = express();
promClient.collectDefaultMetrics();

app.use(helmet());

const defaultAllowedOrigins = [
    'http://localhost:3000',
    'http://localhost:3001',
    'https://amazing-crisp-9bcb1a.netlify.app',
];

const envAllowedOrigins = (process.env.CORS_ORIGINS || '')
    .split(',')
    .map(o => o.trim())
    .filter(Boolean);

const allowedOrigins = [...new Set([...defaultAllowedOrigins, ...envAllowedOrigins])];

const corsOptions = {
    origin: allowedOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));
// Express 5: wildcard ต้องใช้ named parameter
app.options('{*path}', cors(corsOptions));

app.use(express.json());

//Rate Limiting
// const limiter = rateLimit({
//     windowMs: 15 * 60 * 1000, // 15 minutes
//     max: 100,
//     standardHeaders: true,
//     legacyHeaders: false,
// });
// app.use(limiter);

//Metrics Middleware
app.use(metricsMiddleware);

// พ.ร.บ.คอมพิวเตอร์ ม.26 — บันทึกข้อมูลจราจรคอมพิวเตอร์ทุก request
app.use('/api', systemLogMiddleware);

// --- Routes ---
// Root route for platform probes / browser checks
app.get('/', (req, res) => {
    res.status(200).json({
        status: 'ok',
        service: 'DriveToSurvive API',
        docs: '/documentation',
        health: '/api/health',
    });
});

// Avoid noisy 404s from browser favicon probing
app.get('/favicon.ico', (req, res) => {
    res.status(204).end();
});

// Health Check Route
app.get('/api/health', async (req, res) => {
    try {
        const prisma = require('./utils/prisma');
        await prisma.$queryRaw`SELECT 1`;
        res.status(200).json({ status: 'ok' });
    } catch (err) {
        res.status(503).json({ status: 'error', detail: err.message });
    }
});

// Prometheus Metrics Route
app.get('/metrics', async (req, res) => {
    res.set('Content-Type', promClient.register.contentType);
    res.end(await promClient.register.metrics());
});

// Swagger Documentation Route
app.use('/documentation', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Main API Routes
app.use('/api', routes);

app.use((req, res, next) => {
    next(new ApiError(404, `Cannot ${req.method} ${req.originalUrl}`));
});

// --- Error Handling Middleware ---
app.use(errorHandler);

// Export app + bootstrap function
module.exports = { app, ensureAdmin };