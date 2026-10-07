import { useEffect, useRef } from 'react'
import Chart from 'chart.js/auto'
import { band, PALETTE } from './aqi'

export default function TrendChart({ data, selected, mode, metric, hours }) {
  const canvas = useRef(null)
  useEffect(() => {
    const fmt = (t) => new Date(t).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
    const cut = (a) => a.slice(-hours)
    const idxs = mode === 'sel' ? [selected] : data.map((_, i) => i)
    const datasets = idxs.map((i) => ({
      label: data[i].city.name, data: cut(data[i][metric]),
      borderColor: mode === 'sel' ? band(data[i].cur.us_aqi).color : PALETTE[i % PALETTE.length],
      backgroundColor: 'transparent', borderWidth: mode === 'sel' ? 3 : 2, pointRadius: 0, tension: 0.3,
    }))
    const chart = new Chart(canvas.current, {
      type: 'line',
      data: { labels: cut(data[selected].times).map(fmt), datasets },
      options: {
        responsive: true, maintainAspectRatio: false, interaction: { mode: 'index', intersect: false },
        plugins: { legend: { display: mode !== 'sel' } },
        scales: { x: { ticks: { maxTicksLimit: 8, maxRotation: 0 } }, y: { beginAtZero: true, title: { display: true, text: metric === 'aqi' ? 'US AQI' : 'µg/m³' } } },
      },
    })
    return () => chart.destroy()
  }, [data, selected, mode, metric, hours])
  return <div className="cv"><canvas ref={canvas} /></div>
}
