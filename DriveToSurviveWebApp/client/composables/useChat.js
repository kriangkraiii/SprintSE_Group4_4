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

    // Image upload
    const sendImage = async (sessionId, file) => {
        const formData = new FormData()
        formData.append('image', file)
        return $api(`/chat/${sessionId}/image`, { method: 'POST', body: formData })
    }

    // Quick Reply Shortcuts
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
        createSession,
        endSession,
        sendMessage,
        fetchMessages,
        unsendMessage,
        shareLocation,
        reportMessage,
        sendImage,
        fetchShortcuts,
        createShortcutApi,
        updateShortcutApi,
        deleteShortcutApi,
    }
}
