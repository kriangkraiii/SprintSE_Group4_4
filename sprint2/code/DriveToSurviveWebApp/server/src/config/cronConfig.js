/**
 * CRON & Retention Configuration
 * ค่ากำหนดระยะเวลาต่างๆ สำหรับระบบจัดการแชทและ Log
 *
 * ค่าเหล่านี้เปลี่ยนได้ผ่าน Admin API — มีค่าขั้นต่ำตามกฎหมาย/นโยบาย
 */

const cronConfig = {
    // ─── Retention Purge ─────────────────────────────────────
    // ระยะเวลาลบข้อมูลแชท (วัน) — ขั้นต่ำ 90 วัน ตาม พ.ร.บ.คอมพิวเตอร์ พ.ศ.2560 มาตรา 26
    retentionDays: 90,
    retentionDaysMin: 90,

    // ─── Chat Lifecycle ──────────────────────────────────────
    // ระยะเวลาเก็บแชทไว้ให้ผู้ใช้ดู (วัน) — ขั้นต่ำ 3 วัน
    // หลังทริปจบ: ENDED → ยังแชทได้ 24 ชม. → READ_ONLY ตามจำนวนวันนี้ → ARCHIVED
    chatReadOnlyDays: 7,
    chatReadOnlyDaysMin: 3,

    // ─── Admin Log Retention ─────────────────────────────────
    // ระยะเวลาเก็บ ChatLog (archived) ให้แอดมินดู (วัน) — ขั้นต่ำ 9 วัน
    // หลัง ARCHIVED แอดมินยังเข้าดู log ได้จนกว่าหมดเวลานี้
    adminLogRetentionDays: 90,
    adminLogRetentionDaysMin: 9,
};

/**
 * Update retention days with minimum enforcement
 * @param {number} days
 * @returns {number} actual value set
 */
function setRetentionDays(days) {
    const val = Math.max(Number(days) || cronConfig.retentionDaysMin, cronConfig.retentionDaysMin);
    cronConfig.retentionDays = val;
    return val;
}

/**
 * Update chat read-only days with minimum enforcement
 * @param {number} days
 * @returns {number} actual value set
 */
function setChatReadOnlyDays(days) {
    const val = Math.max(Number(days) || cronConfig.chatReadOnlyDaysMin, cronConfig.chatReadOnlyDaysMin);
    cronConfig.chatReadOnlyDays = val;
    return val;
}

/**
 * Update admin log retention days with minimum enforcement
 * @param {number} days
 * @returns {number} actual value set
 */
function setAdminLogRetentionDays(days) {
    const val = Math.max(Number(days) || cronConfig.adminLogRetentionDaysMin, cronConfig.adminLogRetentionDaysMin);
    cronConfig.adminLogRetentionDays = val;
    return val;
}

module.exports = {
    cronConfig,
    setRetentionDays,
    setChatReadOnlyDays,
    setAdminLogRetentionDays,
};
