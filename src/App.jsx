import { useEffect, useState } from 'react'
import Home from './Home'
import Dashboard from './Dashboard'

// Hash routing (#/ and #/dashboard) works on any static host with no server config
const getRoute = () => window.location.hash.replace('#', '') || '/'

export default function App() {
  const [route, setRoute] = useState(getRoute())
  useEffect(() => {
    const onChange = () => { setRoute(getRoute()); window.scrollTo(0, 0) }
    window.addEventListener('hashchange', onChange)
    return () => window.removeEventListener('hashchange', onChange)
  }, [])
  return route.startsWith('/dashboard') ? <Dashboard /> : <Home />
}
