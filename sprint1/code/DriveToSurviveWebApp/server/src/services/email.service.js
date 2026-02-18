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

module.exports = { sendOtpEmail };
