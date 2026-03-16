export function usePlace() {
    const { $api } = useNuxtApp()

    // ─── Saved Places ─────────────────────────────────────────
    const fetchSavedPlaces = () =>
        $api('/places/saved')

    const savePlaceLabel = (data) =>
        $api('/places/saved', { method: 'POST', body: data })

    const deleteSavedPlace = (id) =>
        $api(`/places/saved/${id}`, { method: 'DELETE' })

    // ─── Recent Searches ──────────────────────────────────────
    const fetchRecentSearches = (limit = 10) =>
        $api('/places/recent', { params: { limit } })

    const addRecentSearch = (data) =>
        $api('/places/recent', { method: 'POST', body: data })

    const clearRecentSearches = () =>
        $api('/places/recent', { method: 'DELETE' })

    return {
        fetchSavedPlaces,
        savePlaceLabel,
        deleteSavedPlace,
        fetchRecentSearches,
        addRecentSearch,
        clearRecentSearches,
    }
}
