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

  server.listen(PORT, () => {
    console.log(`🚀 Express API + Socket.IO server running on http://localhost:${PORT}`);
    console.log(`📖 Swagger docs: http://localhost:${PORT}/documentation`);
    console.log(`🔌 WebSocket ready on ws://localhost:${PORT}`);

    // Chat lifecycle CRON — runs every hour
    const { runLifecycleCron } = require('./services/chatLifecycle.service');
    setInterval(() => runLifecycleCron().catch(e => console.error('[CRON] Lifecycle error:', e)), 60 * 60 * 1000);
    console.log('⏰ Chat lifecycle CRON scheduled (hourly)');
  });
})();

// ─── Graceful Shutdown ───
async function gracefulShutdown(signal) {
  console.log(`\n${signal} received. Shutting down gracefully...`);

  // 1. ปิดรับ connection ใหม่
  server.close(() => {
    console.log('  ✔ HTTP server closed');
  });

  // 2. ปิด Socket.IO connections
  io.close(() => {
    console.log('  ✔ Socket.IO closed');
  });

  // 3. Flush pending system logs
  try {
    await systemLogMiddleware.flush();
    console.log('  ✔ System logs flushed');
  } catch {}

  // 4. ปิด Prisma connection
  try {
    await prisma.$disconnect();
    console.log('  ✔ Database disconnected');
  } catch {}

  // 5. Force exit after 10 seconds
  setTimeout(() => {
    console.error('  ⚠ Could not close connections in time, forcing shutdown');
    process.exit(1);
  }, 10000).unref();

  process.exit(0);
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

process.on('unhandledRejection', (err) => {
  console.error('UNHANDLED REJECTION! 💥', err);
  // ไม่ exit ทันที — ให้ log แล้วปล่อยให้ process monitoring จัดการ
});
