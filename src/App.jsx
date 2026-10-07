import { useCallback, useEffect, useState } from 'react'
import { BANDS, band, fetchAqi } from './aqi'
import MapView from './MapView'
import TrendChart from './TrendChart'

const POLLUTANTS = [['PM2.5', 'pm2_5'], ['PM10', 'pm10'], ['NO₂', 'nitrogen_dioxide'], ['O₃', 'ozone'], ['SO₂', 'sulphur_dioxide'], ['CO', 'carbon_monoxide']]

export default function App() {
  const [data, setData] = useState([])
  const [sel, setSel] = useState(0)
  const [mode, setMode] = useState('sel')
  const [status, setStatus] = useState('Loading...')
  const [err, setErr] = useState('')

  const load = useCallback(async () => {
    setStatus('Updating...')
    try {
      setData(await fetchAqi())
      setErr('')
      setStatus('Updated ' + new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }))
    } catch (e) {
      setErr(`Could not load air quality data (${e.message}). Check your internet connection and press Refresh.`)
      setStatus('Failed')
    }
  }, [])

  useEffect(() => {
    load()
    const id = setInterval(load, 10 * 60 * 1000) // auto-refresh every 10 min
    return () => clearInterval(id)
  }, [load])

  const d = data[sel]
  const b = d && band(Math.round(d.cur.us_aqi))
  useEffect(() => {
    if (!b) return
    document.documentElement.style.setProperty('--haze', b.haze)
    document.documentElement.style.setProperty('--accent', b.color)
  }, [b])

  return (
    <main>
      <header>
        <h1>Hawa: live air quality across India</h1>
        <div><span className="status">{status}</span><button className="refresh" onClick={load}>Refresh</button></div>
      </header>
      {err && <div className="err" role="alert">{err}</div>}

      {d && (<>
        <div className="grid">
          <section className="panel hero" aria-live="polite">
            <p className="name">{d.city.name}</p>
            <p className="num">{Math.round(d.cur.us_aqi)}</p>
            <p className="cat">{b.label}</p>
            <p className="tip">{b.tip}</p>
            <div className="poll">
              {POLLUTANTS.map(([n, k]) => (
                <div key={k}>{n}<b>{d.cur[k] == null ? '-' : Math.round(d.cur[k])}</b>µg/m³</div>
              ))}
            </div>
            <div className="scale" aria-hidden="true">{BANDS.map((x) => <i key={x.label} style={{ background: x.color }} />)}</div>
          </section>
          <section className="panel mapwrap"><MapView data={data} selected={sel} onSelect={setSel} /></section>
        </div>

        <section className="panel chartbox">
          <div className="tools">
            <h2>{mode === 'sel' ? `${d.city.name}: AQI, last 3 days` : 'All cities: AQI, last 3 days'}</h2>
            <div className="seg" role="group" aria-label="Chart mode">
              <button aria-pressed={mode === 'sel'} onClick={() => setMode('sel')}>Selected city</button>
              <button aria-pressed={mode === 'all'} onClick={() => setMode('all')}>Compare all</button>
            </div>
          </div>
          <TrendChart data={data} selected={sel} mode={mode} />
        </section>

        <section className="panel list">
          <h2>Cities</h2>
          <div className="cities">
            {data.map((x, i) => {
              const v = Math.round(x.cur.us_aqi), bb = band(v)
              return (
                <button key={x.city.name} className="city" style={{ '--c': bb.color }} aria-pressed={i === sel} onClick={() => setSel(i)}>
                  {x.city.name}<strong>{v}</strong><span>{bb.label}</span>
                </button>
              )
            })}
          </div>
        </section>
      </>)}
    </main>
  )
}
