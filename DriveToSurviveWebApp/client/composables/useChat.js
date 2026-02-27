export function useChat() {
    const { $api } = useNuxtApp()

    const fetchSessions = () =>
        $api('/chat/sessions/me')

    const fetchSession = (bookingId) =>
        $api(`/chat/sessions/${bookingId}`)

    const createSession = (bookingId) =>
        $api('/chat/sessions', { method: 'POST', body: { bookingId } })

    const endSession = (bookingId) =>
        $api('/chat/sessions/end', { method: 'POST', body: { bookingId } })

    const sendMessage = (sessionId, data) =>
        $api(`/chat/${sessionId}/messages`, { method: 'POST', body: data })

    const fetchMessages = (sessionId, opts = {}) =>
        $api(`/chat/${sessionId}/messages`, { params: opts })

    const unsendMessage = (messageId) =>
        $api(`/chat/messages/${messageId}/unsend`, { method: 'PATCH' })

    const shareLocation = (sessionId, lat, lon) =>
        $api(`/chat/${sessionId}/location`, { method: 'POST', body: { lat, lon } })

    const reportMessage = (data) =>
        $api('/chat/reports', { method: 'POST', body: data })

    return {
        fetchSessions,
        fetchSession,
        createSession,
        endSession,
        sendMessage,
        fetchMessages,
        unsendMessage,
        shareLocation,
        reportMessage,
    }
}
