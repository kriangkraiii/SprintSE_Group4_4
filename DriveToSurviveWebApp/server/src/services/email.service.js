const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});

const sendOtpEmail = async (to, otpCode) => {
    const mailOptions = {
        from: `"RideSafe" <${process.env.SMTP_USER}>`,
        to,
        subject: 'รหัส OTP สำหรับรีเซ็ตรหัสผ่าน — RideSafe',
        html: `
            <div style="font-family:'Source Sans 3',Arial,sans-serif;max-width:480px;margin:0 auto;padding:32px;background:#f8fafc;border-radius:12px;">
                <div style="text-align:center;margin-bottom:24px;">
                    <h1 style="font-family:Lexend,sans-serif;color:#0F172A;font-size:24px;margin:0;">RideSafe</h1>
                    <p style="color:#64748b;font-size:14px;margin:8px 0 0;">เดินทางร่วมกันอย่างปลอดภัย</p>
                </div>
                <div style="background:white;padding:24px;border-radius:8px;border:1px solid #e2e8f0;">
                    <p style="color:#0F172A;font-size:16px;margin:0 0 16px;">สวัสดีครับ/ค่ะ,</p>
                    <p style="color:#334155;font-size:14px;margin:0 0 24px;">คุณได้ร้องขอรีเซ็ตรหัสผ่าน กรุณาใช้รหัส OTP ด้านล่าง:</p>
                    <div style="text-align:center;background:#f0f9ff;padding:20px;border-radius:8px;margin-bottom:24px;">
                        <span style="font-family:monospace;font-size:36px;font-weight:bold;color:#0369A1;letter-spacing:8px;">${otpCode}</span>
                    </div>
                    <p style="color:#64748b;font-size:13px;margin:0;">รหัสนี้จะหมดอายุใน <strong>5 นาที</strong></p>
                    <p style="color:#64748b;font-size:13px;margin:8px 0 0;">หากคุณไม่ได้ร้องขอ กรุณาเพิกเฉยอีเมลนี้</p>
                </div>
                <p style="text-align:center;color:#94a3b8;font-size:12px;margin:16px 0 0;">© ${new Date().getFullYear()} RideSafe</p>
            </div>
        `,
    };

    return transporter.sendMail(mailOptions);
};

/**
 * Send arrival notification email (Sprint 2)
 */
const sendArrivalEmail = async (to, radiusType, info) => {
    const titles = {
        FIVE_KM: '🚗 คนขับอยู่ห่าง ~5 กม.',
        ONE_KM: '🚗 คนขับใกล้ถึงแล้ว ~1 กม.',
        ZERO_KM: '✅ คนขับถึงจุดรับแล้ว!',
        MANUAL: '✅ คนขับแจ้งว่าถึงแล้ว',
    };

    const bodies = {
        FIVE_KM: `คนขับ ${info.driverName} กำลังเดินทางมาหาคุณ อยู่ห่างประมาณ 5 กม. กรุณาเตรียมตัวให้พร้อม`,
        ONE_KM: `คนขับ ${info.driverName} ใกล้ถึงแล้ว อยู่ห่างประมาณ 1 กม. กรุณาไปรอที่จุดรับ`,
        ZERO_KM: `คนขับ ${info.driverName} ถึงจุดรับแล้ว! กรุณาไปขึ้นรถได้เลย`,
        MANUAL: `คนขับ ${info.driverName} แจ้งว่าถึงจุดรับแล้ว กรุณาตรวจสอบ`,
    };

    const title = titles[radiusType] || titles.FIVE_KM;
    const body = bodies[radiusType] || bodies.FIVE_KM;

    const mailOptions = {
        from: `"RideSafe" <${process.env.SMTP_USER}>`,
        to,
        subject: `${title} — RideSafe`,
        html: `
            <div style="font-family:'Source Sans 3',Arial,sans-serif;max-width:480px;margin:0 auto;padding:32px;background:#f8fafc;border-radius:12px;">
                <div style="text-align:center;margin-bottom:24px;">
                    <h1 style="font-family:Lexend,sans-serif;color:#0F172A;font-size:24px;margin:0;">RideSafe</h1>
                    <p style="color:#64748b;font-size:14px;margin:8px 0 0;">เดินทางร่วมกันอย่างปลอดภัย</p>
                </div>
                <div style="background:white;padding:24px;border-radius:8px;border:1px solid #e2e8f0;">
                    <p style="color:#0F172A;font-size:16px;margin:0 0 16px;">สวัสดีคุณ ${info.passengerName || 'ผู้โดยสาร'},</p>
                    <div style="text-align:center;background:#f0f9ff;padding:20px;border-radius:8px;margin-bottom:16px;">
                        <span style="font-size:28px;">${radiusType === 'ZERO_KM' || radiusType === 'MANUAL' ? '✅' : '🚗'}</span>
                        <h2 style="color:#0369A1;font-size:18px;margin:8px 0;">${title}</h2>
                    </div>
                    <p style="color:#334155;font-size:14px;margin:0 0 16px;">${body}</p>
                    <p style="color:#64748b;font-size:13px;margin:0;">Booking ID: <strong>${info.bookingId}</strong></p>
                </div>
                <p style="text-align:center;color:#94a3b8;font-size:12px;margin:16px 0 0;">© ${new Date().getFullYear()} RideSafe</p>
            </div>
        `,
    };

    return transporter.sendMail(mailOptions);
};
/**
 * Send booking notification email to driver
 */
const sendBookingEmail = async (to, info) => {
    const mailOptions = {
        from: `"RideSafe" <${process.env.SMTP_USER}>`,
        to,
        subject: `🎉 มีผู้โดยสารจองเส้นทางของคุณ — RideSafe`,
        html: `
            <div style="font-family:'Source Sans 3',Arial,sans-serif;max-width:480px;margin:0 auto;padding:32px;background:#f8fafc;border-radius:12px;">
                <div style="text-align:center;margin-bottom:24px;">
                    <h1 style="font-family:Lexend,sans-serif;color:#0F172A;font-size:24px;margin:0;">RideSafe</h1>
                    <p style="color:#64748b;font-size:14px;margin:8px 0 0;">เดินทางร่วมกันอย่างปลอดภัย</p>
                </div>
                <div style="background:white;padding:24px;border-radius:8px;border:1px solid #e2e8f0;">
                    <p style="color:#0F172A;font-size:16px;margin:0 0 16px;">สวัสดีคุณ ${info.driverName || 'คนขับ'},</p>
                    <div style="text-align:center;background:#ecfdf5;padding:20px;border-radius:8px;margin-bottom:16px;">
                        <span style="font-size:28px;">🎉</span>
                        <h2 style="color:#059669;font-size:18px;margin:8px 0;">มีผู้โดยสารจองเส้นทางของคุณ!</h2>
                    </div>
                    <p style="color:#334155;font-size:14px;margin:0 0 8px;">ผู้โดยสาร: <strong>${info.passengerName || '-'}</strong></p>
                    <p style="color:#334155;font-size:14px;margin:0 0 8px;">จำนวนที่นั่ง: <strong>${info.seats || 1} ที่นั่ง</strong></p>
                    <p style="color:#64748b;font-size:13px;margin:16px 0 0;">กรุณาเข้าไปยืนยันหรือปฏิเสธการจองในแอปพลิเคชัน</p>
                </div>
                <p style="text-align:center;color:#94a3b8;font-size:12px;margin:16px 0 0;">© ${new Date().getFullYear()} RideSafe</p>
            </div>
        `,
    };
    return transporter.sendMail(mailOptions);
};

/**
 * Send review reminder email to passenger after trip completion
 */
const sendReviewReminderEmail = async (to, info) => {
    const mailOptions = {
        from: `"RideSafe" <${process.env.SMTP_USER}>`,
        to,
        subject: `⭐ รีวิวการเดินทางของคุณ — RideSafe`,
        html: `
            <div style="font-family:'Source Sans 3',Arial,sans-serif;max-width:480px;margin:0 auto;padding:32px;background:#f8fafc;border-radius:12px;">
                <div style="text-align:center;margin-bottom:24px;">
                    <h1 style="font-family:Lexend,sans-serif;color:#0F172A;font-size:24px;margin:0;">RideSafe</h1>
                    <p style="color:#64748b;font-size:14px;margin:8px 0 0;">เดินทางร่วมกันอย่างปลอดภัย</p>
                </div>
                <div style="background:white;padding:24px;border-radius:8px;border:1px solid #e2e8f0;">
                    <p style="color:#0F172A;font-size:16px;margin:0 0 16px;">สวัสดีคุณ ${info.passengerName || 'ผู้โดยสาร'},</p>
                    <div style="text-align:center;background:#fffbeb;padding:20px;border-radius:8px;margin-bottom:16px;">
                        <span style="font-size:28px;">⭐</span>
                        <h2 style="color:#b45309;font-size:18px;margin:8px 0;">รีวิวการเดินทางของคุณ</h2>
                    </div>
                    <p style="color:#334155;font-size:14px;margin:0 0 8px;">เส้นทาง: <strong>${info.routeName || '-'}</strong></p>
                    <p style="color:#334155;font-size:14px;margin:0 0 8px;">คนขับ: <strong>${info.driverName || '-'}</strong></p>
                    <p style="color:#64748b;font-size:13px;margin:16px 0 0;">กรุณาเข้าไปเขียนรีวิวในแอปเพื่อช่วยพัฒนาบริการ</p>
                </div>
                <p style="text-align:center;color:#94a3b8;font-size:12px;margin:16px 0 0;">© ${new Date().getFullYear()} RideSafe</p>
            </div>
        `,
    };
    return transporter.sendMail(mailOptions);
};

/**
 * Send email to passenger when booking is confirmed by driver
 */
const sendBookingConfirmedEmail = async (to, info) => {
    const mailOptions = {
        from: `"RideSafe" <${process.env.SMTP_USER}>`,
        to,
        subject: `✅ การจองของคุณได้รับการยืนยันแล้ว — RideSafe`,
        html: `
            <div style="font-family:'Source Sans 3',Arial,sans-serif;max-width:480px;margin:0 auto;padding:32px;background:#f8fafc;border-radius:12px;">
                <div style="text-align:center;margin-bottom:24px;">
                    <h1 style="font-family:Lexend,sans-serif;color:#0F172A;font-size:24px;margin:0;">RideSafe</h1>
                    <p style="color:#64748b;font-size:14px;margin:8px 0 0;">เดินทางร่วมกันอย่างปลอดภัย</p>
                </div>
                <div style="background:white;padding:24px;border-radius:8px;border:1px solid #e2e8f0;">
                    <p style="color:#0F172A;font-size:16px;margin:0 0 16px;">สวัสดีคุณ ${info.passengerName || 'ผู้โดยสาร'},</p>
                    <div style="text-align:center;background:#ecfdf5;padding:20px;border-radius:8px;margin-bottom:16px;">
                        <span style="font-size:28px;">✅</span>
                        <h2 style="color:#059669;font-size:18px;margin:8px 0;">การจองได้รับการยืนยันแล้ว!</h2>
                    </div>
                    <p style="color:#334155;font-size:14px;margin:0 0 8px;">คนขับ: <strong>${info.driverName || '-'}</strong></p>
                    <p style="color:#334155;font-size:14px;margin:0 0 8px;">เส้นทาง: <strong>${info.routeName || '-'}</strong></p>
                    <p style="color:#334155;font-size:14px;margin:0 0 8px;">จำนวนที่นั่ง: <strong>${info.seats || 1} ที่นั่ง</strong></p>
                    <p style="color:#64748b;font-size:13px;margin:16px 0 0;">กรุณาเตรียมตัวและติดตามตำแหน่งคนขับผ่านแอป</p>
                </div>
                <p style="text-align:center;color:#94a3b8;font-size:12px;margin:16px 0 0;">© ${new Date().getFullYear()} RideSafe</p>
            </div>
        `,
    };
    return transporter.sendMail(mailOptions);
};

/**
 * Send email to passenger when booking is rejected by driver
 */
const sendBookingRejectedEmail = async (to, info) => {
    const mailOptions = {
        from: `"RideSafe" <${process.env.SMTP_USER}>`,
        to,
        subject: `❌ คำขอจองถูกปฏิเสธ — RideSafe`,
        html: `
            <div style="font-family:'Source Sans 3',Arial,sans-serif;max-width:480px;margin:0 auto;padding:32px;background:#f8fafc;border-radius:12px;">
                <div style="text-align:center;margin-bottom:24px;">
                    <h1 style="font-family:Lexend,sans-serif;color:#0F172A;font-size:24px;margin:0;">RideSafe</h1>
                    <p style="color:#64748b;font-size:14px;margin:8px 0 0;">เดินทางร่วมกันอย่างปลอดภัย</p>
                </div>
                <div style="background:white;padding:24px;border-radius:8px;border:1px solid #e2e8f0;">
                    <p style="color:#0F172A;font-size:16px;margin:0 0 16px;">สวัสดีคุณ ${info.passengerName || 'ผู้โดยสาร'},</p>
                    <div style="text-align:center;background:#fef2f2;padding:20px;border-radius:8px;margin-bottom:16px;">
                        <span style="font-size:28px;">❌</span>
                        <h2 style="color:#dc2626;font-size:18px;margin:8px 0;">คำขอจองถูกปฏิเสธ</h2>
                    </div>
                    <p style="color:#334155;font-size:14px;margin:0 0 8px;">เส้นทาง: <strong>${info.routeName || '-'}</strong></p>
                    <p style="color:#64748b;font-size:13px;margin:16px 0 0;">ขออภัยค่ะ คนขับได้ปฏิเสธคำขอจองของคุณ กรุณาลองเส้นทางอื่น</p>
                </div>
                <p style="text-align:center;color:#94a3b8;font-size:12px;margin:16px 0 0;">© ${new Date().getFullYear()} RideSafe</p>
            </div>
        `,
    };
    return transporter.sendMail(mailOptions);
};

/**
 * Send email to passenger when driver starts the trip
 */
const sendTripStartedEmail = async (to, info) => {
    const mailOptions = {
        from: `"RideSafe" <${process.env.SMTP_USER}>`,
        to,
        subject: `🚗 คนขับเริ่มเดินทางแล้ว — RideSafe`,
        html: `
            <div style="font-family:'Source Sans 3',Arial,sans-serif;max-width:480px;margin:0 auto;padding:32px;background:#f8fafc;border-radius:12px;">
                <div style="text-align:center;margin-bottom:24px;">
                    <h1 style="font-family:Lexend,sans-serif;color:#0F172A;font-size:24px;margin:0;">RideSafe</h1>
                    <p style="color:#64748b;font-size:14px;margin:8px 0 0;">เดินทางร่วมกันอย่างปลอดภัย</p>
                </div>
                <div style="background:white;padding:24px;border-radius:8px;border:1px solid #e2e8f0;">
                    <p style="color:#0F172A;font-size:16px;margin:0 0 16px;">สวัสดีคุณ ${info.passengerName || 'ผู้โดยสาร'},</p>
                    <div style="text-align:center;background:#eff6ff;padding:20px;border-radius:8px;margin-bottom:16px;">
                        <span style="font-size:28px;">🚗</span>
                        <h2 style="color:#2563eb;font-size:18px;margin:8px 0;">คนขับเริ่มเดินทางแล้ว!</h2>
                    </div>
                    <p style="color:#334155;font-size:14px;margin:0 0 8px;">คนขับ: <strong>${info.driverName || '-'}</strong></p>
                    <p style="color:#334155;font-size:14px;margin:0 0 8px;">เส้นทาง: <strong>${info.routeName || '-'}</strong></p>
                    <p style="color:#64748b;font-size:13px;margin:16px 0 0;">กรุณาเตรียมตัวรอ ณ จุดรับ และติดตามตำแหน่งคนขับผ่านแอป</p>
                </div>
                <p style="text-align:center;color:#94a3b8;font-size:12px;margin:16px 0 0;">© ${new Date().getFullYear()} RideSafe</p>
            </div>
        `,
    };
    return transporter.sendMail(mailOptions);
};

/**
 * Send email to passenger when driver confirms pickup
 */
const sendPassengerPickedUpEmail = async (to, info) => {
    const mailOptions = {
        from: `"RideSafe" <${process.env.SMTP_USER}>`,
        to,
        subject: `👤 คนขับรับคุณขึ้นรถแล้ว — RideSafe`,
        html: `
            <div style="font-family:'Source Sans 3',Arial,sans-serif;max-width:480px;margin:0 auto;padding:32px;background:#f8fafc;border-radius:12px;">
                <div style="text-align:center;margin-bottom:24px;">
                    <h1 style="font-family:Lexend,sans-serif;color:#0F172A;font-size:24px;margin:0;">RideSafe</h1>
                    <p style="color:#64748b;font-size:14px;margin:8px 0 0;">เดินทางร่วมกันอย่างปลอดภัย</p>
                </div>
                <div style="background:white;padding:24px;border-radius:8px;border:1px solid #e2e8f0;">
                    <p style="color:#0F172A;font-size:16px;margin:0 0 16px;">สวัสดีคุณ ${info.passengerName || 'ผู้โดยสาร'},</p>
                    <div style="text-align:center;background:#ecfdf5;padding:20px;border-radius:8px;margin-bottom:16px;">
                        <span style="font-size:28px;">👤</span>
                        <h2 style="color:#059669;font-size:18px;margin:8px 0;">คนขับยืนยันว่ารับคุณขึ้นรถแล้ว</h2>
                    </div>
                    <p style="color:#334155;font-size:14px;margin:0 0 8px;">คนขับ: <strong>${info.driverName || '-'}</strong></p>
                    <p style="color:#334155;font-size:14px;margin:0 0 8px;">เส้นทาง: <strong>${info.routeName || '-'}</strong></p>
                    <p style="color:#64748b;font-size:13px;margin:16px 0 0;">ขอให้เดินทางปลอดภัย!</p>
                </div>
                <p style="text-align:center;color:#94a3b8;font-size:12px;margin:16px 0 0;">© ${new Date().getFullYear()} RideSafe</p>
            </div>
        `,
    };
    return transporter.sendMail(mailOptions);
};

module.exports = {
    sendOtpEmail,
    sendArrivalEmail,
    sendBookingEmail,
    sendReviewReminderEmail,
    sendBookingConfirmedEmail,
    sendBookingRejectedEmail,
    sendTripStartedEmail,
    sendPassengerPickedUpEmail,
};
