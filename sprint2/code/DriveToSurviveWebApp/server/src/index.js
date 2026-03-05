const { app, ensureAdmin } = require('./app');
const http = require('http');
const { initSocketIO } = require('./socket');
const { setIO } = require('./socket/emitter');
const prisma = require('./utils/prisma');
const systemLogMiddleware = require('./middlewares/systemLog.middleware');

const PORT = process.env.PORT || 3001;

// Create HTTP server wrapping Express (needed for Socket.IO)
const server = http.createServer(app);
const io = initSocketIO(server);

// Share io globally for use in services
app.set('io', io);
setIO(io);  // Make io available to socket/emitter helper

// ── Start server with retry (handles node --watch EADDRINUSE) ──
function startServer(port, retries = 10, delay = 500) {
  server.listen(port, () => {
    console.log(`🚀 Express API + Socket.IO server running on http://localhost:${port}`);
    console.log(`📖 Swagger docs: http://localhost:${port}/documentation`);
    console.log(`🔌 WebSocket ready on ws://localhost:${port}`);

    // Chat lifecycle CRON — runs every hour
    const { runLifecycleCron } = require('./services/chatLifecycle.service');
    setInterval(() => runLifecycleCron().catch(e => console.error('[CRON] Lifecycle error:', e)), 60 * 60 * 1000);
    console.log('⏰ Chat lifecycle CRON scheduled (hourly)');
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE' && retries > 0) {
      console.log(`⏳ Port ${port} busy, retrying in ${delay}ms... (${retries} retries left)`);
      setTimeout(() => {
        server.close();
        startServer(port, retries - 1, delay);
      }, delay);
    } else {
      console.error('❌ Server error:', err);
      process.exit(1);
    }
  });
}

(async () => {
  try {
    const bootstrapResult = await ensureAdmin();
    if (bootstrapResult?.status === 'done') {
      console.log('✅ Admin bootstrap completed');
    } else if (bootstrapResult?.status === 'skipped') {
      console.log(`ℹ️ Admin bootstrap skipped (${bootstrapResult.reason})`);
    }
  } catch (e) {
    console.error('Admin bootstrap failed:', e);
  }

  startServer(PORT);
})();

// ─── Graceful Shutdown ───
async function gracefulShutdown(signal) {
  console.log(`\n${signal} received. Shutting down gracefully...`);

  // 1. Flush pending system logs
  try {
    await systemLogMiddleware.flush();
    console.log('  ✔ System logs flushed');
  } catch {}

  // 2. ปิด Socket.IO connections
  try {
    await new Promise((resolve) => io.close(resolve));
    console.log('  ✔ Socket.IO closed');
  } catch {}

  // 3. ปิด HTTP server (รอ port ถูกปล่อยจริง)
  try {
    await new Promise((resolve, reject) => {
      server.close((err) => {
        if (err) reject(err);
        else resolve();
      });
    });
    console.log('  ✔ HTTP server closed');
  } catch {}

  // 4. ปิด Prisma connection
  try {
    await prisma.$disconnect();
    console.log('  ✔ Database disconnected');
  } catch {}

  process.exit(0);
}

// Force exit after 5 seconds if graceful shutdown hangs
process.on('SIGTERM', () => {
  const forceTimer = setTimeout(() => process.exit(1), 5000);
  forceTimer.unref();
  gracefulShutdown('SIGTERM');
});
process.on('SIGINT', () => {
  const forceTimer = setTimeout(() => process.exit(1), 5000);
  forceTimer.unref();
  gracefulShutdown('SIGINT');
});

process.on('unhandledRejection', (err) => {
  console.error('UNHANDLED REJECTION! 💥', err);
});
