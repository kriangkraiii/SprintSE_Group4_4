const { app, ensureAdmin } = require('./app');

const PORT = process.env.PORT || 3001;

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

  app.listen(PORT, () => {
    console.log(`🚀 Express API server running on http://localhost:${PORT}`);
    console.log(`📖 Swagger docs: http://localhost:${PORT}/documentation`);
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
