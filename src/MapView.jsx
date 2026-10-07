import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { band, CITIES } from './aqi'

export default function MapView({ data, selected, onSelect, onMapClick }) {
  const el = useRef(null), map = useRef(null), layer = useRef(null), first = useRef(true)
  const clickRef = useRef(onMapClick)
  clickRef.current = onMapClick

  useEffect(() => {
    map.current = L.map(el.current, { scrollWheelZoom: false }).setView([21.5, 79], 4.5)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 12, attribution: '&copy; OpenStreetMap contributors',
    }).addTo(map.current)
    layer.current = L.layerGroup().addTo(map.current)
    map.current.fitBounds(CITIES.map((c) => [c.lat, c.lon]), { padding: [45, 45] }) // show every city
    map.current.on('click', (e) => clickRef.current(e.latlng.lat, e.latlng.lng)) // click anywhere to check that spot
    return () => { map.current.remove(); map.current = null }
  }, [])

  useEffect(() => { // fly to the selected place (skip the first render so the whole-India view stays)
    if (first.current) { first.current = false; return }
    const d = data[selected]
    if (d && map.current) map.current.flyTo([d.city.lat, d.city.lon], Math.max(map.current.getZoom(), 6), { duration: 0.8 })
  }, [selected])

  useEffect(() => {
    layer.current.clearLayers()
    data.forEach((d, i) => {
      const v = Math.round(d.cur.us_aqi), b = band(v), on = i === selected
      const m = L.circleMarker([d.city.lat, d.city.lon], {
        radius: on ? 22 : 17, color: on ? '#16202a' : '#fff', weight: on ? 3 : 2, fillColor: b.color, fillOpacity: 0.9, bubblingMouseEvents: false,
      }).addTo(layer.current)
      m.bindTooltip(String(v), { permanent: true, direction: 'center', className: 'aqitip' })
      m.bindPopup(`<b>${d.city.name}</b><br>AQI ${v}: ${b.label}`)
      m.on('click', () => onSelect(i))
    })
  }, [data, selected, onSelect])

  return (<><div ref={el} className="map" aria-label="Map of city AQI" /><p className="hint">Tip: click anywhere on the map to check the air at that spot.</p></>)
}
