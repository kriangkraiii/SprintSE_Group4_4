export function getProvinceFromPlace(place) {
    if (!place || !place.address_components) return null

    const provinceComponent = place.address_components.find(c =>
        c.types.includes('administrative_area_level_1')
    )

    return provinceComponent ? provinceComponent.long_name : null
}

export function stripCountry(address) {
    return (address || '').replace(/,?\s*(Thailand|ไทย|ประเทศ)\s*$/i, '').replace(/\s{2,}/g, ' ').trim()
}

export function stripLeadingPlusCode(address) {
    // Basic heuristic to remove Plus Codes (often look like "MQJ2+3X ...")
    // If the address starts with a code like pattern and a space, remove it.
    return address.replace(/^[A-Z0-9]+\+[A-Z0-9]+\s+/, '')
}
