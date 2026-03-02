import { io } from 'socket.io-client'

let _socket = null

export function useChat() {
    const { $api } = useNuxtApp()
    const config = useRuntimeConfig()

    // ─── Socket.IO helpers ─────────────────────────────
    function connectChatSocket(token) {
        if (_socket?.connected) return _socket
        if (_socket) { _socket.disconnect(); _socket = null }
        const serverUrl = config.public?.apiBase?.replace('/api', '') || 'http://localhost:3001'
        _socket = io(serverUrl, {
            auth: { token },
            transports: ['websocket', 'polling'],
        })
        return _socket
    }

    function joinSession(sessionId) {
        _socket?.emit('join-session', sessionId)
    }

    function leaveSession(sessionId) {
        _socket?.emit('leave-session', sessionId)
    }

    function onNewMessage(callback) {
        _socket?.on('new-message', callback)
    }

    function offNewMessage(callback) {
        _socket?.off('new-message', callback)
    }

    function emitNewMessage(sessionId, message) {
        _socket?.emit('send-message', { sessionId, message })
    }

    function emitEditMessage(sessionId, message) {
        _socket?.emit('edit-message', { sessionId, message })
    }

    function emitUnsendMessage(sessionId, messageId) {
        _socket?.emit('unsend-message', { sessionId, messageId })
    }

    function onMessageEdited(callback) {
        _socket?.on('message-edited', callback)
    }

    function offMessageEdited(callback) {
        _socket?.off('message-edited', callback)
    }

    function onMessageUnsent(callback) {
        _socket?.on('message-unsent', callback)
    }

    function offMessageUnsent(callback) {
        _socket?.off('message-unsent', callback)
    }

    function emitTyping(sessionId) {
        _socket?.emit('typing', sessionId)
    }

    function emitStopTyping(sessionId) {
        _socket?.emit('stop-typing', sessionId)
    }

    function onTyping(callback) {
        _socket?.on('user-typing', callback)
    }

    function onStopTyping(callback) {
        _socket?.on('user-stop-typing', callback)
    }

    function offTyping(callback) {
        _socket?.off('user-typing', callback)
    }

    function offStopTyping(callback) {
        _socket?.off('user-stop-typing', callback)
    }

    // Real-time notification listener
    function onNewNotification(callback) {
        _socket?.on('new-notification', callback)
    }

    function offNewNotification(callback) {
        _socket?.off('new-notification', callback)
    }

    function disconnectSocket() {
        if (_socket) { _socket.disconnect(); _socket = null }
    }

    function getSocket() { return _socket }

    const fetchSessions = () =>
        $api('/chat/sessions/me')

    // Get session by route ID (primary)
    const fetchSession = (routeId) =>
        $api(`/chat/sessions/${routeId}`)

    // Get session by booking ID (compat)
    const fetchSessionByBooking = (bookingId) =>
        $api(`/chat/sessions/booking/${bookingId}`)

    // Create session — supports both routeId and bookingId
    const createSession = (bookingIdOrRouteId, isRouteId = false) =>
        $api('/chat/sessions', {
            method: 'POST',
            body: isRouteId ? { routeId: bookingIdOrRouteId } : { bookingId: bookingIdOrRouteId }
        })

    const endSession = (routeId) =>
        $api('/chat/sessions/end', { method: 'POST', body: { routeId } })

    const sendMessage = (sessionId, data) =>
        $api(`/chat/${sessionId}/messages`, { method: 'POST', body: data })

    const fetchMessages = (sessionId, opts = {}) =>
        $api(`/chat/${sessionId}/messages`, { params: opts })

    const editMessage = (messageId, data) =>
        $api(`/chat/messages/${messageId}/edit`, { method: 'PATCH', body: data })

    const unsendMessage = (messageId) =>
        $api(`/chat/messages/${messageId}/unsend`, { method: 'PATCH' })

    const shareLocation = (sessionId, lat, lon) =>
        $api(`/chat/${sessionId}/location`, { method: 'POST', body: { lat, lon } })

    const reportMessage = (data) =>
        $api('/chat/reports', { method: 'POST', body: data })

    const sendImage = async (sessionId, file) => {
        const formData = new FormData()
        formData.append('image', file)
        return $api(`/chat/${sessionId}/image`, { method: 'POST', body: formData })
    }

    const fetchShortcuts = () =>
        $api('/chat/shortcuts/me')

    const createShortcutApi = (text) =>
        $api('/chat/shortcuts', { method: 'POST', body: { text } })

    const updateShortcutApi = (id, text) =>
        $api(`/chat/shortcuts/${id}`, { method: 'PATCH', body: { text } })

    const deleteShortcutApi = (id) =>
        $api(`/chat/shortcuts/${id}`, { method: 'DELETE' })

    return {
        fetchSessions,
        fetchSession,
        fetchSessionByBooking,
        createSession,
        endSession,
        sendMessage,
        fetchMessages,
        editMessage,
        unsendMessage,
        shareLocation,
        reportMessage,
        sendImage,
        fetchShortcuts,
        createShortcutApi,
        updateShortcutApi,
        deleteShortcutApi,
        // Socket.IO helpers
        connectChatSocket,
        joinSession,
        leaveSession,
        onNewMessage,
        offNewMessage,
        emitNewMessage,
        emitEditMessage,
        emitUnsendMessage,
        onMessageEdited,
        offMessageEdited,
        onMessageUnsent,
        offMessageUnsent,
        emitTyping,
        emitStopTyping,
        onTyping,
        onStopTyping,
        offTyping,
        offStopTyping,
        onNewNotification,
        offNewNotification,
        disconnectSocket,
        getSocket,
    }
}
