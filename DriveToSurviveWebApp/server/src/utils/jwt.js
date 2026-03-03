require("dotenv").config({ quiet: true });
const jwt = require("jsonwebtoken");

const secret = process.env.JWT_SECRET;
if (!secret) {
    throw new Error("Missing JWT_SECRET in environment");
}

// Server boot epoch — เปลี่ยนทุกครั้งที่ restart → token เก่าจะ invalid
const BOOT_EPOCH = Math.floor(Date.now() / 1000);

const signToken = (payload, options = { expiresIn: "7d" }) => {
    return jwt.sign({ ...payload, bootEpoch: BOOT_EPOCH }, secret, options);
};

const verifyToken = (token) => {
    const decoded = jwt.verify(token, secret);
    // ตรวจว่า token ออกหลัง server boot ปัจจุบันเท่านั้น
    if (decoded.bootEpoch !== BOOT_EPOCH) {
        const err = new Error('Token issued before server restart');
        err.name = 'ServerRestartError';
        throw err;
    }
    return decoded;
};

module.exports = { signToken, verifyToken, BOOT_EPOCH };