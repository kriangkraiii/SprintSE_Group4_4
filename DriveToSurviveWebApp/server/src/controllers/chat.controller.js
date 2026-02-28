const asyncHandler = require('express-async-handler');
const chatService = require('../services/chat.service');
const chatReportService = require('../services/chatReport.service');

// ─── Session Endpoints ───────────────────────────────────

const createSession = asyncHandler(async (req, res) => {
    const { bookingId } = req.body;
    const session = await chatService.createSession(bookingId);
    res.status(201).json({ success: true, data: session });
});

const endSession = asyncHandler(async (req, res) => {
    const { bookingId } = req.body;
    const session = await chatService.endSession(bookingId);
    res.status(200).json({ success: true, data: session });
});

const getSession = asyncHandler(async (req, res) => {
    const { bookingId } = req.params;
    const userId = req.user.sub;
    const session = await chatService.getSession(bookingId, userId);
    res.status(200).json({ success: true, data: session });
});

const getMySessions = asyncHandler(async (req, res) => {
    const userId = req.user.sub;
    const sessions = await chatService.getMySessions(userId);
    res.status(200).json({ success: true, data: sessions });
});

// ─── Message Endpoints ───────────────────────────────────

const sendMessage = asyncHandler(async (req, res) => {
    const userId = req.user.sub;
    const { sessionId } = req.params;
    const message = await chatService.sendMessage(sessionId, userId, req.body);
    res.status(201).json({ success: true, data: message });
});

const getMessages = asyncHandler(async (req, res) => {
    const userId = req.user.sub;
    const { sessionId } = req.params;
    const result = await chatService.getMessages(sessionId, userId, req.query);
    res.status(200).json({ success: true, ...result });
});

const unsendMessage = asyncHandler(async (req, res) => {
    const userId = req.user.sub;
    const { messageId } = req.params;
    const result = await chatService.unsendMessage(messageId, userId);
    res.status(200).json({ success: true, data: result });
});

const shareLocation = asyncHandler(async (req, res) => {
    const userId = req.user.sub;
    const { sessionId } = req.params;
    const { lat, lon } = req.body;
    const message = await chatService.shareLocation(sessionId, userId, lat, lon);
    res.status(201).json({ success: true, data: message });
});

// ─── Report Endpoints ────────────────────────────────────

const createReport = asyncHandler(async (req, res) => {
    const userId = req.user.sub;
    const { sessionId, messageId, reason, detail } = req.body;
    const report = await chatReportService.createReport(sessionId, messageId, userId, reason, detail);
    res.status(201).json({ success: true, data: report });
});

const listReportsAdmin = asyncHandler(async (req, res) => {
    const result = await chatReportService.listReports(req.query);
    res.status(200).json({ success: true, ...result });
});

const updateReportAdmin = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { status, adminNote } = req.body;
    const result = await chatReportService.updateReportStatus(id, status, adminNote);
    res.status(200).json({ success: true, data: result });
});

// ─── Image Upload ────────────────────────────────────────

const { uploadToCloudinary } = require('../utils/cloudinary');

const sendImageMessage = asyncHandler(async (req, res) => {
    const userId = req.user.sub;
    const { sessionId } = req.params;
    if (!req.file) {
        return res.status(400).json({ success: false, message: 'กรุณาเลือกรูปภาพ' });
    }
    const { url } = await uploadToCloudinary(req.file.buffer, 'chat-images');
    const message = await chatService.sendMessage(sessionId, userId, {
        type: 'IMAGE',
        content: '📷 รูปภาพ',
        imageUrl: url,
    });
    res.status(201).json({ success: true, data: message });
});

// ─── Quick Reply Shortcuts ───────────────────────────────

const quickReplyService = require('../services/quickReply.service');

const getMyShortcuts = asyncHandler(async (req, res) => {
    const data = await quickReplyService.getMyShortcuts(req.user.sub);
    res.status(200).json({ success: true, data });
});

const createShortcut = asyncHandler(async (req, res) => {
    const { text } = req.body;
    const data = await quickReplyService.createShortcut(req.user.sub, text);
    res.status(201).json({ success: true, data });
});

const updateShortcut = asyncHandler(async (req, res) => {
    const { text } = req.body;
    const data = await quickReplyService.updateShortcut(req.params.id, req.user.sub, text);
    res.status(200).json({ success: true, data });
});

const deleteShortcut = asyncHandler(async (req, res) => {
    await quickReplyService.deleteShortcut(req.params.id, req.user.sub);
    res.status(200).json({ success: true, message: 'ลบคีย์ลัดแล้ว' });
});

// ─── Admin: Chat Viewer ──────────────────────────────────

const chatAdminService = require('../services/chatAdmin.service');

const adminGetSessions = asyncHandler(async (req, res) => {
    const data = await chatAdminService.getAllSessions(req.query);
    res.status(200).json({ success: true, data });
});

const adminGetMessages = asyncHandler(async (req, res) => {
    const data = await chatAdminService.getSessionMessages(req.params.id);
    res.status(200).json({ success: true, data });
});

const adminGetLogs = asyncHandler(async (req, res) => {
    const data = await chatAdminService.getArchivedLogs(req.query);
    res.status(200).json({ success: true, data });
});

module.exports = {
    createSession,
    endSession,
    getSession,
    getMySessions,
    sendMessage,
    getMessages,
    unsendMessage,
    shareLocation,
    createReport,
    listReportsAdmin,
    updateReportAdmin,
    sendImageMessage,
    getMyShortcuts,
    createShortcut,
    updateShortcut,
    deleteShortcut,
    adminGetSessions,
    adminGetMessages,
    adminGetLogs,
};
