// Data source: Open-Meteo Air Quality API (free, no API key, CORS enabled)
export const CITIES = [
  { name: 'Delhi', lat: 28.6139, lon: 77.209 },
  { name: 'Mumbai', lat: 19.076, lon: 72.8777 },
  { name: 'Bengaluru', lat: 12.9716, lon: 77.5946 },
  { name: 'Kolkata', lat: 22.5726, lon: 88.3639 },
  { name: 'Chennai', lat: 13.0827, lon: 80.2707 },
  { name: 'Hyderabad', lat: 17.385, lon: 78.4867 },
]
// US AQI bands
export const BANDS = [
  { max: 50, label: 'Good', color: '#2f9e44', haze: '#e8f3ea', tip: 'Air is clean. Enjoy the outdoors.' },
  { max: 100, label: 'Moderate', color: '#e0b000', haze: '#f5f1df', tip: 'Fine for most. Very sensitive people may feel it.' },
  { max: 150, label: 'Unhealthy for sensitive groups', color: '#f08c00', haze: '#f6ebdc', tip: 'Kids, elderly and asthma patients should cut outdoor time.' },
  { max: 200, label: 'Unhealthy', color: '#e03131', haze: '#f4e3e1', tip: 'Everyone should limit long outdoor exertion. Mask up.' },
  { max: 300, label: 'Very unhealthy', color: '#862e9c', haze: '#eadff0', tip: 'Avoid outdoor activity. Run an air purifier indoors.' },
  { max: Infinity, label: 'Hazardous', color: '#7b1d2e', haze: '#ecdadd', tip: 'Stay indoors with windows closed.' },
]
export const band = (v) => BANDS.find((b) => v <= b.max)
export const PALETTE = ['#16202a', '#e03131', '#1c7ed6', '#2f9e44', '#f08c00', '#862e9c']

export async function fetchPlaces(places) {
  const q = new URLSearchParams({
    latitude: places.map((p) => p.lat).join(','),
    longitude: places.map((p) => p.lon).join(','),
    current: 'us_aqi,pm2_5,pm10,nitrogen_dioxide,ozone,sulphur_dioxide,carbon_monoxide',
    hourly: 'us_aqi,pm2_5,pm10',
    past_days: 3,
    forecast_days: 2,
    timezone: 'Asia/Kolkata',
  })
  const res = await fetch('https://air-quality-api.open-meteo.com/v1/air-quality?' + q)
  if (!res.ok) throw new Error('API returned ' + res.status)
  const json = await res.json()
  return (Array.isArray(json) ? json : [json]).map((r, i) => {
    let k = r.hourly.time.findIndex((t) => t > r.current.time) // first future hour
    if (k === -1) k = r.hourly.time.length
    let best = null // cleanest forecast hour in the next 24h
    for (let j = k; j < Math.min(k + 24, r.hourly.time.length); j++) {
      const v = r.hourly.us_aqi[j]
      if (v != null && (!best || v < best.aqi)) best = { time: r.hourly.time[j], aqi: v }
    }
    const cut = (a) => a.slice(0, k)
    return { city: places[i], cur: r.current, times: cut(r.hourly.time), aqi: cut(r.hourly.us_aqi), pm25: cut(r.hourly.pm2_5), pm10: cut(r.hourly.pm10), best }
  })
}
export const fetchAqi = () => fetchPlaces(CITIES)

// Open-Meteo geocoding: free, no key
export async function searchCity(name) {
  const res = await fetch('https://geocoding-api.open-meteo.com/v1/search?' + new URLSearchParams({ name, count: 5, language: 'en' }))
  const j = await res.json()
  return (j.results || []).map((r) => ({ name: r.name + (r.admin1 ? ', ' + r.admin1 : ''), lat: r.latitude, lon: r.longitude }))
}

// Health guidance: sensitive groups are treated as one or two AQI bands "worse"
export const GROUPS = [['Everyone', 0], ['Children & elderly', 1], ['Asthma, heart or lung conditions', 2], ['Runners & outdoor workers', 1]]
const ADVICE = [
  'Great day to be outside.',
  'Fine for outdoor plans. Watch for any irritation.',
  'Shorten long outdoor activity and prefer the cleaner hours.',
  'Move heavy exercise indoors and wear an N95/FFP2 mask outside.',
  'Stay indoors where possible and run an air purifier.',
  'Avoid going out. Keep windows closed and the purifier on.',
]
export const advice = (v, shift) => ADVICE[Math.min(BANDS.indexOf(band(v)) + shift, 5)]
