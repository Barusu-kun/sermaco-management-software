// src/app.js — Point d'entrée Express
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const env = require('./config/env');
const { errorHandler } = require('./shared/errors/errorHandler');
const { verifyToken } = require('./modules/auth/auth.middleware');
const { apiLimiter } = require('./shared/middleware/rateLimiter');

const authRoutes = require('./modules/auth/auth.routes');
const personnelRoutes = require('./modules/personnel/personnel.routes');
const clientRoutes = require('./modules/clients/clients.routes');
const serviceRoutes = require('./modules/services/services.routes');
const calendarRoutes = require('./modules/calendar/calendar.routes');
const statsRoutes = require('./modules/stats/stats.routes');
const exportsRoutes = require('./modules/exports/exports.routes');
const driverRoutes = require('./modules/driver/driver.routes');

const app = express();

// ── Middlewares globaux ──
app.use(helmet());
app.use(
  cors({
    origin: env.allowedOrigins,
    credentials: true,
  })
);
if (env.nodeEnv !== 'test') app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use('/api/', apiLimiter);

// ── Health check ──
app.get('/health', (req, res) => res.json({ status: 'ok', timestamp: new Date() }));

// ── Routes publiques ──
app.use('/api/v1/auth', authRoutes);

// ── Routes protégées ──
app.use('/api/v1/personnel', verifyToken, personnelRoutes);
app.use('/api/v1/clients', verifyToken, clientRoutes);
app.use('/api/v1/services', verifyToken, serviceRoutes);
app.use('/api/v1/calendar', verifyToken, calendarRoutes);
app.use('/api/v1/stats', verifyToken, statsRoutes);
app.use('/api/v1/exports', exportsRoutes); // verifyToken géré en interne (token query autorisé)
app.use('/api/v1/driver', verifyToken, driverRoutes);

// ── 404 ──
app.use((req, res) => res.status(404).json({ success: false, message: 'Route non trouvée' }));

// ── Gestion des erreurs ──
app.use(errorHandler);

const PORT = env.port;
if (require.main === module) {
  app.listen(PORT, () => console.log(`🚀 API démarrée sur le port ${PORT} (${env.nodeEnv})`));
}

module.exports = app;
