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

export async function fetchAqi() {
  const q = new URLSearchParams({
    latitude: CITIES.map((c) => c.lat).join(','),
    longitude: CITIES.map((c) => c.lon).join(','),
    current: 'us_aqi,pm2_5,pm10,nitrogen_dioxide,ozone,sulphur_dioxide,carbon_monoxide',
    hourly: 'us_aqi',
    past_days: 3,
    forecast_days: 1,
    timezone: 'Asia/Kolkata',
  })
  const res = await fetch('https://air-quality-api.open-meteo.com/v1/air-quality?' + q)
  if (!res.ok) throw new Error('API returned ' + res.status)
  const json = await res.json()
  return (Array.isArray(json) ? json : [json]).map((r, i) => {
    const idx = r.hourly.time.findIndex((t) => t > r.current.time) // only hours up to now
    const end = idx === -1 ? r.hourly.time.length : idx
    return { city: CITIES[i], cur: r.current, times: r.hourly.time.slice(0, end), aqi: r.hourly.us_aqi.slice(0, end) }
  })
}
