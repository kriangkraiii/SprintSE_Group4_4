const fs = require('fs')
const path = require('path')

// --- Province EN→TH mapping ---
const PROVINCE_TH = {
    'Amnat Charoen': 'อำนาจเจริญ', 'Ang Thong': 'อ่างทอง', 'Bangkok Metropolis': 'กรุงเทพมหานคร',
    'Bueng Kan': 'บึงกาฬ', 'Buri Ram': 'บุรีรัมย์', 'Chachoengsao': 'ฉะเชิงเทรา',
    'Chai Nat': 'ชัยนาท', 'Chaiyaphum': 'ชัยภูมิ', 'Chanthaburi': 'จันทบุรี',
    'Chiang Mai': 'เชียงใหม่', 'Chiang Rai': 'เชียงราย', 'Chon Buri': 'ชลบุรี',
    'Chumphon': 'ชุมพร', 'Kalasin': 'กาฬสินธุ์', 'Kamphaeng Phet': 'กำแพงเพชร',
    'Kanchanaburi': 'กาญจนบุรี', 'Khon Kaen': 'ขอนแก่น', 'Krabi': 'กระบี่',
    'Lampang': 'ลำปาง', 'Lamphun': 'ลำพูน', 'Loei': 'เลย',
    'Lop Buri': 'ลพบุรี', 'Mae Hong Son': 'แม่ฮ่องสอน', 'Maha Sarakham': 'มหาสารคาม',
    'Mukdahan': 'มุกดาหาร', 'Nakhon Nayok': 'นครนายก', 'Nakhon Pathom': 'นครปฐม',
    'Nakhon Phanom': 'นครพนม', 'Nakhon Ratchasima': 'นครราชสีมา', 'Nakhon Sawan': 'นครสวรรค์',
    'Nakhon Si Thammarat': 'นครศรีธรรมราช', 'Nan': 'น่าน', 'Narathiwat': 'นราธิวาส',
    'Nong Bua Lam Phu': 'หนองบัวลำภู', 'Nong Khai': 'หนองคาย', 'Nonthaburi': 'นนทบุรี',
    'Pathum Thani': 'ปทุมธานี', 'Pattani': 'ปัตตานี', 'Phangnga': 'พังงา',
    'Phatthalung': 'พัทลุง', 'Phayao': 'พะเยา', 'Phetchabun': 'เพชรบูรณ์',
    'Phetchaburi': 'เพชรบุรี', 'Phichit': 'พิจิตร', 'Phitsanulok': 'พิษณุโลก',
    'Phra Nakhon Si Ayutthaya': 'พระนครศรีอยุธยา', 'Phrae': 'แพร่', 'Phuket': 'ภูเก็ต',
    'Prachin Buri': 'ปราจีนบุรี', 'Prachuap Khiri Khan': 'ประจวบคีรีขันธ์',
    'Ranong': 'ระนอง', 'Ratchaburi': 'ราชบุรี', 'Rayong': 'ระยอง', 'Roi Et': 'ร้อยเอ็ด',
    'Sa Kaeo': 'สระแก้ว', 'Sakon Nakhon': 'สกลนคร', 'Samut Prakan': 'สมุทรปราการ',
    'Samut Sakhon': 'สมุทรสาคร', 'Samut Songkhram': 'สมุทรสงคราม', 'Saraburi': 'สระบุรี',
    'Satun': 'สตูล', 'Si Sa Ket': 'ศรีสะเกษ', 'Sing Buri': 'สิงห์บุรี',
    'Songkhla': 'สงขลา', 'Sukhothai': 'สุโขทัย', 'Suphan Buri': 'สุพรรณบุรี',
    'Surat Thani': 'สุราษฎร์ธานี', 'Surin': 'สุรินทร์', 'Tak': 'ตาก',
    'Trang': 'ตรัง', 'Trat': 'ตราด', 'Ubon Ratchathani': 'อุบลราชธานี',
    'Udon Thani': 'อุดรธานี', 'Uthai Thani': 'อุทัยธานี', 'Uttaradit': 'อุตรดิตถ์',
    'Yala': 'ยะลา', 'Yasothon': 'ยโสธร'
}

// --- Ray-casting point-in-polygon ---
function pointInPolygon(lat, lng, polygon) {
    let inside = false
    const x = lng, y = lat
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
        const xi = polygon[i][0], yi = polygon[i][1]
        const xj = polygon[j][0], yj = polygon[j][1]
        const intersect = ((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi)
        if (intersect) inside = !inside
    }
    return inside
}

function pointInFeature(lat, lng, feature) {
    const geom = feature.geometry
    if (geom.type === 'Polygon') {
        return pointInPolygon(lat, lng, geom.coordinates[0])
    }
    if (geom.type === 'MultiPolygon') {
        return geom.coordinates.some(poly => pointInPolygon(lat, lng, poly[0]))
    }
    return false
}

// --- Load GeoJSON on startup ---
let provinces = null

function loadData() {
    if (provinces) return
    try {
        const filePath = path.join(__dirname, '../../data/thailand-provinces.json')
        const raw = fs.readFileSync(filePath, 'utf8')
        provinces = JSON.parse(raw)
        console.log(`[ThaiGeo] Loaded ${provinces.features.length} provinces`)
    } catch (err) {
        console.error('[ThaiGeo] Failed to load GeoJSON:', err.message)
        provinces = { features: [] }
    }
}

/**
 * Lookup province from lat/lng using point-in-polygon
 * @param {number} lat
 * @param {number} lng
 * @returns {{ province_en: string, province_th: string } | null}
 */
function lookupProvince(lat, lng) {
    loadData()
    if (!lat || !lng) return null

    for (const feature of provinces.features) {
        if (pointInFeature(lat, lng, feature)) {
            const nameEn = feature.properties.name
            return {
                province_en: nameEn,
                province_th: PROVINCE_TH[nameEn] || nameEn
            }
        }
    }
    return null
}

/**
 * Enrich a location object with province data
 * @param {object} location - { lat, lng, name?, address?, province? }
 * @returns {object} - Same object with province/province_en added
 */
function enrichLocation(location) {
    if (!location || !location.lat || !location.lng) return location
    if (location.province && location.province_en) return location

    const result = lookupProvince(Number(location.lat), Number(location.lng))
    if (result) {
        location.province = result.province_th
        location.province_en = result.province_en
    }
    return location
}

module.exports = { lookupProvince, enrichLocation, PROVINCE_TH }
