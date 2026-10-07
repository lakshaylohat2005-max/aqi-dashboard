import { useState } from 'react'
import { searchCity } from './aqi'

export default function PlaceSearch({ onPick, placeholder = 'Search any city...' }) {
  const [q, setQ] = useState('')
  const [res, setRes] = useState(null)
  const [busy, setBusy] = useState(false)
  async function go(e) {
    e.preventDefault()
    if (!q.trim()) return
    setBusy(true)
    try { setRes(await searchCity(q.trim())) } catch { setRes([]) }
    setBusy(false)
  }
  return (
    <div className="ps">
      <form onSubmit={go}>
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={placeholder} aria-label="Search city" />
        <button disabled={busy}>{busy ? '...' : 'Search'}</button>
      </form>
      {res && (
        <ul>
          {res.length === 0 && <li className="none">No place found</li>}
          {res.map((p) => (
            <li key={p.lat + ',' + p.lon}><button onClick={() => { onPick(p); setRes(null); setQ('') }}>{p.name}</button></li>
          ))}
        </ul>
      )}
    </div>
  )
}
