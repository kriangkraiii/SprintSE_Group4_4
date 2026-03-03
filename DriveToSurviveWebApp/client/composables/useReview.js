export function useReview() {
    const { $api } = useNuxtApp()

    const createReview = (data) =>
        $api('/reviews', { method: 'POST', body: data })

    const fetchDriverReviews = (driverId, opts = {}) =>
        $api(`/reviews/driver/${driverId}`, { params: opts })

    const fetchDriverStats = (driverId) =>
        $api(`/reviews/driver/${driverId}/stats`)

    const fetchMyReviews = (opts = {}) =>
        $api('/reviews/me', { params: opts })

    const fetchPendingReviews = () =>
        $api('/reviews/pending')

    const checkReviewed = (bookingId) =>
        $api(`/reviews/check/${bookingId}`)

    const fetchReviewByBooking = (bookingId) =>
        $api(`/reviews/booking/${bookingId}`)

    const createDispute = (data) =>
        $api('/reviews/disputes', { method: 'POST', body: data })

    const fetchMyReceivedReviews = (opts = {}) =>
        $api('/reviews/my-received', { params: opts })

    return {
        createReview,
        fetchDriverReviews,
        fetchDriverStats,
        fetchMyReviews,
        fetchMyReceivedReviews,
        fetchPendingReviews,
        checkReviewed,
        fetchReviewByBooking,
        createDispute,
    }
}
