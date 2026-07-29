import { useCallback, useEffect, useRef, useState } from 'react'
import Globe, { type GlobeMethods } from 'react-globe.gl'
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

export function ProfileWorldMap({ people }: { people: WorldMapPerson[] }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const globeRef = useRef<GlobeMethods | undefined>(undefined)
  const [size, setSize] = useState({ width: 700, height: 230 })

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
    controls.autoRotate = true
    controls.autoRotateSpeed = 0.32
    controls.enablePan = false
    controls.enableZoom = true
    controls.minDistance = 102
    controls.maxDistance = 420
  }, [])

  const makeMarker = useCallback((value: object) => {
    const person = value as WorldMapPerson
    const link = document.createElement('a')
    link.className = 'globe-person'
    link.href = `/profile/${encodeURIComponent(person.username)}`
    link.setAttribute('aria-label', `${person.name} in ${person.location} with ${person.socialPoints} social points`)

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
  }, [])

  return <div ref={containerRef} className="community-map interactive-world-map">
    <Globe
      ref={globeRef}
      width={size.width}
      height={size.height}
      backgroundColor="rgba(0,0,0,0)"
      globeImageUrl="https://unpkg.com/three-globe/example/img/earth-blue-marble.jpg"
      bumpImageUrl="https://unpkg.com/three-globe/example/img/earth-topology.png"
      showAtmosphere
      atmosphereColor="#d889a0"
      atmosphereAltitude={0.14}
      htmlElementsData={people}
      htmlLat="latitude"
      htmlLng="longitude"
      htmlAltitude={0.04}
      htmlElement={makeMarker}
      onGlobeReady={prepareGlobe}
    />
    <div className="map-controls-hint">Drag to rotate · Scroll or pinch to zoom</div>
  </div>
}
