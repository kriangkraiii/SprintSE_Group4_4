const { app, ensureAdmin } = require('./app');
const http = require('http');
const { initSocketIO } = require('./socket');
const { setIO } = require('./socket/emitter');

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
process.on('unhandledRejection', (err) => {
  console.error('UNHANDLED REJECTION! 💥 Shutting down...');
  console.error(err);
  process.exit(1);
});

process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  process.exit(0);
});
