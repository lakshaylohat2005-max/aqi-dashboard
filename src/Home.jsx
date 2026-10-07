import { useEffect, useState } from 'react'
import { BANDS, advice, band, fetchAqi, fetchPlaces } from './aqi'
import PlaceSearch from './PlaceSearch'
import './home.css'

const FEATURES = [
  ['Live AQI', 'Real-time air quality for six major Indian cities, with PM2.5, PM10, NO₂, O₃, SO₂ and CO readings.'],
  ['Interactive map', 'Colour-coded markers show which cities are breathing easy and which are struggling, at a glance.'],
  ['3-day trends', 'See how air quality changed hour by hour, and compare all cities on a single graph.'],
]
const STEPS = [
  ['Fetch', 'The app calls the free Open-Meteo Air Quality API straight from your browser. No key, no server.'],
  ['Process', 'React sorts the readings into AQI categories and keeps the last three days of hourly data.'],
  ['Visualise', 'Leaflet draws the map and Chart.js draws the trend lines, refreshed every 10 minutes.'],
]

function useCountUp(target, ms = 900) {
  const [v, setV] = useState(0)
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) { setV(target); return }
    let raf, t0
    const step = (t) => {
      t0 ??= t
      const p = Math.min((t - t0) / ms, 1)
      setV(Math.round(target * (1 - Math.pow(1 - p, 3))))
      if (p < 1) raf = requestAnimationFrame(step)
    }
    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }, [target, ms])
  return v
}

function Result({ d }) {
  const v = Math.round(d.cur.us_aqi), b = band(v), shown = useCountUp(v)
  const link = `#/dashboard?name=${encodeURIComponent(d.city.name)}&lat=${d.city.lat}&lon=${d.city.lon}`
  return (
    <div className="result" style={{ '--c': b.color }}>
      <div><p className="rname">{d.city.name}</p><p className="rnum">{shown}</p></div>
      <div>
        <p className="rcat">{b.label}</p>
        <p>{advice(v, 0)}</p>
        <a href={link} className="btn small">Open in dashboard →</a>
      </div>
    </div>
  )
}

export default function Home() {
  const [data, setData] = useState([])
  const [res, setRes] = useState(null)
  const pick = (p) => { setRes({ loading: true }); fetchPlaces([p]).then(([d]) => setRes(d.cur.us_aqi == null ? { error: true } : d)).catch(() => setRes({ error: true })) }
  useEffect(() => {
    document.documentElement.style.removeProperty('--haze')
    document.documentElement.style.removeProperty('--accent')
    fetchAqi().then(setData).catch(() => {}) // strip is optional: hide it if the API fails
  }, [])

  return (
    <div className="home">
      <nav className="nav">
        <a href="#/" className="logo">Hawa</a>
        <div>
          <a href="#features">Features</a>
          <a href="#scale">AQI scale</a>
          <a href="#how">How it works</a>
          <a href="#/dashboard" className="btn small">Open dashboard</a>
        </div>
      </nav>

      <header className="hero">
        <p className="eyebrow">Live air quality across India</p>
        <h1>Know the air<br />you breathe.</h1>
        <p className="lead">Hawa tracks live AQI for Delhi, Mumbai, Bengaluru and more, with a map and trend graphs, so you can decide when to step out and when to stay in.</p>
        <div className="cta">
          <a href="#/dashboard" className="btn">Open the dashboard →</a>
          <a href="#how" className="btn ghost">How it works</a>
        </div>
        {data.length > 0 && (
          <div className="strip" aria-label="Live AQI right now">
            {data.map((d) => {
              const v = Math.round(d.cur.us_aqi)
              return (
                <a key={d.city.name} href="#/dashboard" className="chip" style={{ '--c': band(v).color }}>
                  <span>{d.city.name}</span><strong>{v}</strong>
                </a>
              )
            })}
          </div>
        )}
        <div className="try">
          <p className="eyebrow">Try it: check any city in the world</p>
          <PlaceSearch onPick={pick} placeholder="Type a city, e.g. Pune, Jaipur, London" />
          {res && res.loading && <p className="hintx">Fetching...</p>}
          {res && res.error && <p className="hintx">Could not get air quality data for that place. Try another.</p>}
          {res && res.cur && <Result d={res} />}
        </div>
      </header>

      <section id="features" className="sec">
        <h2>What you get</h2>
        <div className="cards">
          {FEATURES.map(([t, d], i) => (
            <article key={t} className="card"><span className="idx">0{i + 1}</span><h3>{t}</h3><p>{d}</p></article>
          ))}
        </div>
      </section>

      <section id="scale" className="sec">
        <h2>Reading the AQI</h2>
        <p className="sub">The Air Quality Index turns pollutant levels into one number. Higher means dirtier air.</p>
        <div className="bands">
          {BANDS.map((b, i) => {
            const lo = i === 0 ? 0 : BANDS[i - 1].max + 1
            return (
              <div key={b.label} className="band" style={{ '--c': b.color }}>
                <strong>{b.max === Infinity ? `${lo}+` : `${lo}-${b.max}`}</strong>
                <span>{b.label}</span>
                <small>{b.tip}</small>
              </div>
            )
          })}
        </div>
      </section>

      <section id="how" className="sec">
        <h2>How it works</h2>
        <div className="cards">
          {STEPS.map(([t, d], i) => (
            <article key={t} className="card"><span className="idx">{i + 1}</span><h3>{t}</h3><p>{d}</p></article>
          ))}
        </div>
        <div className="cta center"><a href="#/dashboard" className="btn">See it live →</a></div>
      </section>

      <footer className="foot">
        <p>Data: <a href="https://open-meteo.com/en/docs/air-quality-api">Open-Meteo</a>. Map: OpenStreetMap contributors. Values use the US AQI scale, so they may differ from India's CPCB index.</p>
        <p>Built with React, Leaflet and Chart.js. <a href="https://github.com/lakshaylohat2005-max/aqi-dashboard">Source on GitHub</a></p>
      </footer>
    </div>
  )
}
