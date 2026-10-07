import { useCallback, useEffect, useState } from 'react'
import { BANDS, CITIES, GROUPS, advice, band, fetchPlaces } from './aqi'
import MapView from './MapView'
import TrendChart from './TrendChart'
import PlaceSearch from './PlaceSearch'

const POLLUTANTS = [['PM2.5', 'pm2_5'], ['PM10', 'pm10'], ['NO₂', 'nitrogen_dioxide'], ['O₃', 'ozone'], ['SO₂', 'sulphur_dioxide'], ['CO', 'carbon_monoxide']]
const METRICS = [['aqi', 'AQI'], ['pm25', 'PM2.5'], ['pm10', 'PM10']]
const hourLabel = (t) => new Date(t).toLocaleTimeString('en-IN', { hour: 'numeric', hour12: true })

// "Open in dashboard" from the home page passes a place in the URL hash
function startPlaces() {
  const p = new URLSearchParams(window.location.hash.split('?')[1] || '')
  const lat = parseFloat(p.get('lat')), lon = parseFloat(p.get('lon'))
  return isNaN(lat) || isNaN(lon) ? CITIES : [...CITIES, { name: p.get('name') || 'Shared place', lat, lon }]
}

export default function Dashboard() {
  const [places, setPlaces] = useState(startPlaces)
  const [data, setData] = useState([])
  const [sel, setSel] = useState(places.length > CITIES.length ? places.length - 1 : 0)
  const [mode, setMode] = useState('sel')
  const [metric, setMetric] = useState('aqi')
  const [hours, setHours] = useState(72)
  const [group, setGroup] = useState(0)
  const [status, setStatus] = useState('Loading...')
  const [err, setErr] = useState('')

  const load = useCallback(async () => {
    setStatus('Updating...')
    try {
      setData(await fetchPlaces(places))
      setErr('')
      setStatus('Updated ' + new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }))
    } catch (e) {
      setErr(`Could not load air quality data (${e.message}). Check your internet connection and press Refresh.`)
      setStatus('Failed')
    }
  }, [places])

  useEffect(() => {
    load()
    const id = setInterval(load, 10 * 60 * 1000)
    return () => clearInterval(id)
  }, [load])

  async function addPlace(p) {
    const i = places.findIndex((x) => Math.abs(x.lat - p.lat) < 0.05 && Math.abs(x.lon - p.lon) < 0.05)
    if (i >= 0) { setSel(i); return }
    setStatus('Adding ' + p.name + '...')
    try {
      const [d] = await fetchPlaces([p])
      if (d.cur.us_aqi == null) throw new Error('no air quality data for this spot')
      setSel(places.length); setPlaces((ps) => [...ps, p]); setData((ds) => [...ds, d]); setErr('')
    } catch (e) { setErr(`Could not add ${p.name}: ${e.message}`) }
  }
  const removePlace = (i) => { setPlaces((ps) => ps.filter((_, k) => k !== i)); setData((ds) => ds.filter((_, k) => k !== i)); setSel(0) }
  const locate = () => navigator.geolocation
    ? navigator.geolocation.getCurrentPosition((pos) => addPlace({ name: 'My location', lat: pos.coords.latitude, lon: pos.coords.longitude }), () => setErr('Location permission was denied.'))
    : setErr('Geolocation is not supported in this browser.')

  const d = data[sel]
  const v = d && Math.round(d.cur.us_aqi)
  const b = d && band(v)
  useEffect(() => {
    if (!b) return
    document.documentElement.style.setProperty('--haze', b.haze)
    document.documentElement.style.setProperty('--accent', b.color)
  }, [b])

  return (
    <main>
      <header>
        <div><a className="back" href="#/">← Home</a><h1>Hawa: live air quality</h1></div>
        <div><span className="status">{status}</span><button className="refresh" onClick={load}>Refresh</button></div>
      </header>
      <div className="tools2">
        <PlaceSearch onPick={addPlace} />
        <button className="pill" onClick={locate}>📍 Use my location</button>
      </div>
      {err && <div className="err" role="alert">{err}</div>}

      {d && (<>
        <div className="grid">
          <section className="panel hero" aria-live="polite">
            <p className="name">{d.city.name}</p>
            <p className="num">{v}</p>
            <p className="cat">{b.label}</p>
            <p className="tip">{b.tip}</p>
            <div className="poll">
              {POLLUTANTS.map(([n, k]) => (
                <div key={k}>{n}<b>{d.cur[k] == null ? '-' : Math.round(d.cur[k])}</b>µg/m³</div>
              ))}
            </div>
            <div className="scale" aria-hidden="true">{BANDS.map((x) => <i key={x.label} style={{ background: x.color }} />)}</div>
            <div className="advice">
              <label>Advice for
                <select value={group} onChange={(e) => setGroup(+e.target.value)}>
                  {GROUPS.map(([n], i) => <option key={n} value={i}>{n}</option>)}
                </select>
              </label>
              <p>{advice(v, GROUPS[group][1])}</p>
              {d.best && <p>Cleanest hour ahead: <b>{hourLabel(d.best.time)}</b> (AQI {Math.round(d.best.aqi)}, forecast)</p>}
              <small>General guidance, not medical advice.</small>
            </div>
            {sel >= CITIES.length && <button className="pill" style={{ marginTop: 12 }} onClick={() => removePlace(sel)}>Remove this place</button>}
          </section>
          <section className="panel mapwrap"><MapView data={data} selected={sel} onSelect={setSel} onMapClick={(lat, lon) => addPlace({ name: `Pin ${lat.toFixed(2)}, ${lon.toFixed(2)}`, lat, lon })} /></section>
        </div>

        <section className="panel chartbox">
          <div className="tools">
            <h2>{mode === 'sel' ? d.city.name : 'All places'}: {METRICS.find((m) => m[0] === metric)[1]}, last {hours === 24 ? '24 hours' : '3 days'}</h2>
            <div className="tools2" style={{ margin: 0 }}>
              <div className="seg" role="group" aria-label="Metric">
                {METRICS.map(([k, l]) => <button key={k} aria-pressed={metric === k} onClick={() => setMetric(k)}>{l}</button>)}
              </div>
              <div className="seg" role="group" aria-label="Range">
                <button aria-pressed={hours === 24} onClick={() => setHours(24)}>24h</button>
                <button aria-pressed={hours === 72} onClick={() => setHours(72)}>3 days</button>
              </div>
              <div className="seg" role="group" aria-label="Chart mode">
                <button aria-pressed={mode === 'sel'} onClick={() => setMode('sel')}>Selected</button>
                <button aria-pressed={mode === 'all'} onClick={() => setMode('all')}>Compare all</button>
              </div>
            </div>
          </div>
          <TrendChart data={data} selected={sel} mode={mode} metric={metric} hours={hours} />
        </section>

        <section className="panel list">
          <h2>Places</h2>
          <div className="cities">
            {data.map((x, i) => {
              const val = Math.round(x.cur.us_aqi), bb = band(val)
              return (
                <button key={x.city.name + i} className="city" style={{ '--c': bb.color }} aria-pressed={i === sel} onClick={() => setSel(i)}>
                  {x.city.name}<strong>{val}</strong><span>{bb.label}</span>
                </button>
              )
            })}
          </div>
        </section>
      </>)}
    </main>
  )
}
