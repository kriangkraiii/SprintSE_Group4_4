/**
 * Environment Validation
 * ตรวจสอบ required env vars ก่อน server start
 */
function validateEnv() {
    const required = [
        'DATABASE_URL',
        'JWT_SECRET',
    ];

    const recommended = [
        'CORS_ORIGINS',
        'PORT',
    ];

    const missing = required.filter(key => !process.env[key]);
    const missingRecommended = recommended.filter(key => !process.env[key]);

    if (missing.length > 0) {
        console.error('❌ Missing REQUIRED environment variables:');
        missing.forEach(key => console.error(`   - ${key}`));
        console.error('\nServer cannot start without these variables.');
        process.exit(1);
    }

    if (missingRecommended.length > 0) {
        console.warn('⚠️  Missing RECOMMENDED environment variables:');
        missingRecommended.forEach(key => console.warn(`   - ${key}`));
        console.warn('   Server will use defaults.\n');
    }

    console.log('✅ Environment validation passed');
}

module.exports = { validateEnv };
