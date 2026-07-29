import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Globe, { type GlobeMethods } from 'react-globe.gl'
import { useApp } from '../../context/AppContext'
import { formatCount } from '../../lib/format'

export type WorldMapPerson = {
  username: string
  name: string
  avatar: string
  location: string
  socialPoints: number
  latitude: number
  longitude: number
}
type WorldMapCluster = {
  key: string
  latitude: number
  longitude: number
  people: WorldMapPerson[]
}

export function ProfileWorldMap({ people }: { people: WorldMapPerson[] }) {
  const { dark } = useApp()
  const containerRef = useRef<HTMLDivElement>(null)
  const globeRef = useRef<GlobeMethods | undefined>(undefined)
  const [size, setSize] = useState({ width: 700, height: 230 })
  const clusters = useMemo(() => {
    const grouped = new Map<string, WorldMapCluster>()
    people.forEach(person => {
      const key = person.location.trim().toLowerCase()
      const cluster = grouped.get(key)
      if (cluster) cluster.people.push(person)
      else grouped.set(key, { key, latitude: person.latitude, longitude: person.longitude, people: [person] })
    })
    return [...grouped.values()]
  }, [people])

  useEffect(() => {
    if (!containerRef.current) return
    const observer = new ResizeObserver(([entry]) => {
      const width = Math.max(280, Math.round(entry.contentRect.width))
      const height = window.innerWidth <= 760 ? 210 : 230
      setSize({ width, height })
    })
    observer.observe(containerRef.current)
    return () => observer.disconnect()
  }, [])

  const prepareGlobe = useCallback(() => {
    const globe = globeRef.current
    if (!globe) return
    globe.pointOfView({ lat: 28, lng: -60, altitude: 2.05 }, 0)
    globe.renderer().setPixelRatio(Math.min(window.devicePixelRatio, 1.5))
    const controls = globe.controls()
    controls.autoRotate = false
    controls.enablePan = false
    controls.enableZoom = true
    controls.minDistance = 102
    controls.maxDistance = 420
  }, [])

  const makePersonMarker = (person: WorldMapPerson) => {
    const link = document.createElement('a')
    link.className = 'globe-person'
    link.href = `/profile/${encodeURIComponent(person.username)}`
    link.setAttribute('aria-label', `${person.name} in ${person.location} with ${person.socialPoints} social points`)
    link.addEventListener('pointerdown', event => event.stopPropagation())
    link.addEventListener('click', event => {
      event.preventDefault()
      event.stopPropagation()
      window.location.assign(link.href)
    })

    const badge = document.createElement('b')
    badge.textContent = `${formatCount(person.socialPoints)} pts`
    link.appendChild(badge)

    if (person.avatar) {
      const image = document.createElement('img')
      image.src = person.avatar
      image.alt = ''
      image.referrerPolicy = 'no-referrer'
      link.appendChild(image)
    } else {
      const initial = document.createElement('span')
      initial.textContent = person.name.slice(0, 1)
      link.appendChild(initial)
    }

    const city = document.createElement('small')
    city.textContent = person.location.split(',')[0]
    link.appendChild(city)
    return link
  }

  const makeMarkerCluster = useCallback((value: object) => {
    const cluster = value as WorldMapCluster
    const group = document.createElement('div')
    group.className = 'globe-cluster'
    cluster.people.forEach(person => group.appendChild(makePersonMarker(person)))
    return group
  }, [])

  return <div ref={containerRef} className={`community-map interactive-world-map ${dark ? 'map-dark' : 'map-light'}`}>
    <Globe
      key={dark ? 'dark-earth' : 'light-earth'}
      ref={globeRef}
      width={size.width}
      height={size.height}
      backgroundColor="rgba(0,0,0,0)"
      globeImageUrl={dark
        ? 'https://unpkg.com/three-globe/example/img/earth-night.jpg'
        : 'https://unpkg.com/three-globe/example/img/earth-day.jpg'}
      bumpImageUrl="https://unpkg.com/three-globe/example/img/earth-topology.png"
      showAtmosphere
      atmosphereColor={dark ? '#d35f79' : '#8ebfd3'}
      atmosphereAltitude={dark ? 0.15 : 0.18}
      htmlElementsData={clusters}
      htmlLat="latitude"
      htmlLng="longitude"
      htmlAltitude={0}
      htmlElement={makeMarkerCluster}
      onGlobeReady={prepareGlobe}
    />
    <div className="map-controls-hint">Drag to rotate · Scroll or pinch to zoom</div>
  </div>
}
