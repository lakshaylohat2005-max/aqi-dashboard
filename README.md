# Hawa: Air Quality Dashboard

Live AQI for Delhi, Mumbai, Bengaluru, Kolkata, Chennai and Hyderabad with an interactive map and 3-day trend graphs.
Built to practise **API integration** and **data visualization**.

## Features
- Live US AQI and pollutants (PM2.5, PM10, NO₂, O₃, SO₂, CO)
- Leaflet map with colour-coded AQI markers (click a marker or a city card to select)
- Chart.js trend graph: selected city or compare all cities
- Search any city in the world (Open-Meteo geocoding), click anywhere on the map, or use your location
- Chart switches between AQI / PM2.5 / PM10 and 24h / 3 days; health advice per group; cleanest forecast hour
- Home page with live city strip and a try-it city checker
- Page colour follows the AQI category; auto-refresh every 10 minutes; error message if the API fails

## Tech
React 18, Vite, Leaflet, Chart.js, [Open-Meteo Air Quality API](https://open-meteo.com/en/docs/air-quality-api) (free, no API key)

## Run locally
```bash
npm install
npm run dev      # open the URL shown in the terminal
npm run build    # production build in dist/
```

## Project structure
- `src/aqi.js`: cities, AQI bands, and the `fetchAqi()` API call
- `src/App.jsx`: state, auto-refresh, hero panel, city list
- `src/MapView.jsx`: Leaflet map
- `src/TrendChart.jsx`: Chart.js graph

## Notes
AQI uses the US scale (0-500), so values can differ from India's CPCB AQI.

## Deploy
Push to GitHub and import the repo on Netlify or Vercel (build command `npm run build`, output `dist`).
