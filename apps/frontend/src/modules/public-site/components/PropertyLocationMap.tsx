import { useEffect, useMemo, useRef, useState } from 'react'

import { Badge } from '@/design-system'
import type { LocationMapConfig, LocationMapPoint } from '@/modules/public-site/api/publicSiteApi'
import { cn } from '@/shared/lib/cn'

type PropertyLocationMapProps = {
  config?: LocationMapConfig
  fallbackAddress?: string
  fallbackName?: string
  fallbackLocationName?: string
}

type MapCenter = {
  lat: number
  lng: number
}

type MapSize = {
  height: number
  width: number
}

type TileItem = {
  key: string
  left: number
  top: number
  url: string
}

type RouteMode = 'driving' | 'transit'

type RouteCoordinate = {
  lat: number
  lng: number
}

type RouteAlternative = {
  coordinates: RouteCoordinate[]
  distanceMeters: number
  durationSeconds: number
  label: string
}

type RouteResult = {
  alternatives: RouteAlternative[]
  mode: RouteMode
  originLabel: string
  selectedIndex: number
}

type NominatimPlace = {
  display_name: string
  lat: string
  lon: string
}

type OsrmRoute = {
  distance: number
  duration: number
  geometry: {
    coordinates: [number, number][]
  }
}

const tileSize = 256
const minZoom = 10
const maxZoom = 18

const defaultMapConfig: LocationMapConfig = {
  venue: {
    name: 'Parcela recreativa',
    address: '',
    latitude: null,
    longitude: null,
    mapImageUrl: '',
    mapNotes: '',
  },
  points: [],
}

const categoryLabels: Record<string, string> = {
  butcher: 'Carnicerias',
  drinks: 'Botillerias',
  groceries: 'Minimarkets',
  landmark: 'Referencias',
  pharmacy: 'Farmacias',
  station: 'Estaciones',
  venue: 'Recinto',
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

function getPointLabel(point: LocationMapPoint) {
  return categoryLabels[point.category] || point.category || 'Punto'
}

function getDestination(config: LocationMapConfig, fallbackAddress = '', fallbackName = '') {
  if (config.venue.latitude !== null && config.venue.longitude !== null) {
    return `${config.venue.latitude},${config.venue.longitude}`
  }

  return config.venue.address || fallbackAddress || config.venue.name || fallbackName
}

function buildDirectionsUrl(origin: string, destination: string, travelMode: 'driving' | 'transit') {
  const params = new URLSearchParams({
    api: '1',
    destination,
    origin,
    travelmode: travelMode,
  })

  return `https://www.google.com/maps/dir/?${params.toString()}`
}

function formatRouteDuration(seconds: number) {
  const totalMinutes = Math.max(Math.round(seconds / 60), 1)
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60

  if (hours === 0) {
    return `${minutes} min`
  }

  if (minutes === 0) {
    return `${hours} h`
  }

  return `${hours} h ${minutes} min`
}

function formatRouteDistance(meters: number) {
  if (meters < 1000) {
    return `${Math.round(meters)} m`
  }

  return `${(meters / 1000).toFixed(1).replace('.', ',')} km`
}

function stopMapControlEvent(event: React.PointerEvent<HTMLElement> | React.MouseEvent<HTMLElement>) {
  event.stopPropagation()
}

function hasVenueCoordinates(config: LocationMapConfig) {
  return config.venue.latitude !== null && config.venue.longitude !== null
}

function latLngToWorld(lat: number, lng: number, zoom: number) {
  const sinLat = Math.sin((clamp(lat, -85.05112878, 85.05112878) * Math.PI) / 180)
  const scale = tileSize * 2 ** zoom

  return {
    x: ((lng + 180) / 360) * scale,
    y: (0.5 - Math.log((1 + sinLat) / (1 - sinLat)) / (4 * Math.PI)) * scale,
  }
}

function worldToLatLng(x: number, y: number, zoom: number) {
  const scale = tileSize * 2 ** zoom
  const lng = (x / scale) * 360 - 180
  const latRadians = Math.atan(Math.sinh(Math.PI - (2 * Math.PI * y) / scale))

  return {
    lat: (latRadians * 180) / Math.PI,
    lng,
  }
}

function getPointPosition(
  center: MapCenter,
  point: { latitude: number | null; longitude: number | null },
  size: MapSize,
  zoom: number,
) {
  if (point.latitude === null || point.longitude === null) {
    return null
  }

  const centerWorld = latLngToWorld(center.lat, center.lng, zoom)
  const pointWorld = latLngToWorld(point.latitude, point.longitude, zoom)

  return {
    left: size.width / 2 + pointWorld.x - centerWorld.x,
    top: size.height / 2 + pointWorld.y - centerWorld.y,
  }
}

function getCoordinatePosition(
  center: MapCenter,
  coordinate: RouteCoordinate,
  size: MapSize,
  zoom: number,
) {
  return getPointPosition(
    center,
    { latitude: coordinate.lat, longitude: coordinate.lng },
    size,
    zoom,
  )
}

function getMapTiles(center: MapCenter, size: MapSize, zoom: number): TileItem[] {
  if (size.width === 0 || size.height === 0) {
    return []
  }

  const centerWorld = latLngToWorld(center.lat, center.lng, zoom)
  const topLeft = {
    x: centerWorld.x - size.width / 2,
    y: centerWorld.y - size.height / 2,
  }
  const startX = Math.floor(topLeft.x / tileSize)
  const endX = Math.floor((topLeft.x + size.width) / tileSize)
  const startY = Math.floor(topLeft.y / tileSize)
  const endY = Math.floor((topLeft.y + size.height) / tileSize)
  const maxTile = 2 ** zoom
  const tiles: TileItem[] = []

  for (let x = startX; x <= endX; x += 1) {
    for (let y = startY; y <= endY; y += 1) {
      if (y < 0 || y >= maxTile) {
        continue
      }

      const wrappedX = ((x % maxTile) + maxTile) % maxTile
      tiles.push({
        key: `${zoom}-${x}-${y}`,
        left: x * tileSize - topLeft.x,
        top: y * tileSize - topLeft.y,
        url: `https://tile.openstreetmap.org/${zoom}/${wrappedX}/${y}.png`,
      })
    }
  }

  return tiles
}

export function PropertyLocationMap({
  config = defaultMapConfig,
  fallbackAddress = '',
  fallbackLocationName = '',
  fallbackName = 'Parcela recreativa',
}: PropertyLocationMapProps) {
  const hasCoordinates = hasVenueCoordinates(config)
  const venueCenter = useMemo<MapCenter>(
    () => ({
      lat: config.venue.latitude ?? -33.807,
      lng: config.venue.longitude ?? -70.741,
    }),
    [config.venue.latitude, config.venue.longitude],
  )
  const mapRef = useRef<HTMLDivElement | null>(null)
  const dragRef = useRef<{ center: MapCenter; pointerX: number; pointerY: number } | null>(null)
  const [mapCenter, setMapCenter] = useState<MapCenter>(venueCenter)
  const [mapSize, setMapSize] = useState<MapSize>({ height: 0, width: 0 })
  const [zoom, setZoom] = useState(15)
  const activePoints = useMemo(
    () => config.points.filter((point) => point.isActive),
    [config.points],
  )
  const categories = useMemo(
    () => Array.from(new Set(activePoints.map((point) => point.category))).filter(Boolean),
    [activePoints],
  )
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedPointId, setSelectedPointId] = useState(activePoints[0]?.id || '')
  const [originAddress, setOriginAddress] = useState('')
  const [routeError, setRouteError] = useState('')
  const [routeResult, setRouteResult] = useState<RouteResult | null>(null)
  const [routeMode, setRouteMode] = useState<RouteMode | null>(null)
  const [isRouting, setIsRouting] = useState(false)

  useEffect(() => {
    setMapCenter(venueCenter)
  }, [venueCenter])

  useEffect(() => {
    if (!mapRef.current) {
      return
    }

    const observer = new ResizeObserver(([entry]) => {
      setMapSize({
        height: entry.contentRect.height,
        width: entry.contentRect.width,
      })
    })
    observer.observe(mapRef.current)

    return () => observer.disconnect()
  }, [])

  const selectedPoint = activePoints.find((point) => point.id === selectedPointId) || activePoints[0]
  const visiblePoints =
    selectedCategory === 'all'
      ? activePoints
      : activePoints.filter((point) => point.category === selectedCategory)
  const destination = getDestination(config, fallbackAddress, fallbackName)
  const displayAddress = config.venue.address || fallbackAddress || fallbackLocationName
  const canBuildRoute = Boolean(originAddress.trim() && destination)
  const routeUrl =
    canBuildRoute && routeMode
      ? buildDirectionsUrl(originAddress.trim(), destination, routeMode)
      : ''
  const selectedRoute = routeResult?.alternatives[routeResult.selectedIndex] || null
  const routeLinePoints = useMemo(() => {
    if (!selectedRoute || mapSize.width === 0 || mapSize.height === 0) {
      return ''
    }

    return selectedRoute.coordinates
      .map((coordinate) => getCoordinatePosition(mapCenter, coordinate, mapSize, zoom))
      .filter(Boolean)
      .map((position) => `${position?.left},${position?.top}`)
      .join(' ')
  }, [mapCenter, mapSize, selectedRoute, zoom])
  const mapTiles = useMemo(
    () => getMapTiles(mapCenter, mapSize, zoom),
    [mapCenter, mapSize, zoom],
  )
  const venuePinPosition = getPointPosition(mapCenter, config.venue, mapSize, zoom)

  useEffect(() => {
    const mapElement = mapRef.current
    if (!mapElement) {
      return
    }

    function handleNativeWheel(event: WheelEvent) {
      if (!hasCoordinates || !event.ctrlKey) {
        return
      }

      event.preventDefault()
      event.stopPropagation()
      setZoom((current) => clamp(current + (event.deltaY < 0 ? 1 : -1), minZoom, maxZoom))
    }

    mapElement.addEventListener('wheel', handleNativeWheel, { passive: false })

    return () => {
      mapElement.removeEventListener('wheel', handleNativeWheel)
    }
  }, [hasCoordinates])

  function moveMapByPixels(deltaX: number, deltaY: number, baseCenter = mapCenter) {
    const world = latLngToWorld(baseCenter.lat, baseCenter.lng, zoom)
    setMapCenter(worldToLatLng(world.x + deltaX, world.y + deltaY, zoom))
  }

  function zoomBy(nextDelta: number) {
    setZoom((current) => clamp(current + nextDelta, minZoom, maxZoom))
  }

  function recenterVenue() {
    setMapCenter(venueCenter)
  }

  async function calculateRoute(nextMode: RouteMode) {
    setRouteMode(nextMode)
    setRouteError('')

    if (!canBuildRoute) {
      return
    }

    if (nextMode === 'transit') {
      setRouteResult(null)
      return
    }

    if (config.venue.latitude === null || config.venue.longitude === null) {
      setRouteError('Agrega coordenadas de la parcela para calcular rutas sobre el mapa.')
      return
    }

    try {
      setIsRouting(true)
      const searchParams = new URLSearchParams({
        format: 'json',
        limit: '1',
        q: originAddress.trim(),
      })
      const geocodeResponse = await fetch(
        `https://nominatim.openstreetmap.org/search?${searchParams.toString()}`,
        {
          headers: {
            Accept: 'application/json',
            'Accept-Language': 'es-CL,es;q=0.9',
          },
        },
      )

      if (!geocodeResponse.ok) {
        throw new Error('No pudimos ubicar esa direccion.')
      }

      const places = (await geocodeResponse.json()) as NominatimPlace[]
      const origin = places[0]

      if (!origin) {
        throw new Error('No encontramos esa direccion. Prueba agregando comuna o ciudad.')
      }

      const routeResponse = await fetch(
        [
          'https://router.project-osrm.org/route/v1/driving',
          `${origin.lon},${origin.lat};${config.venue.longitude},${config.venue.latitude}`,
        ].join('/') + '?overview=full&geometries=geojson&alternatives=true',
      )

      if (!routeResponse.ok) {
        throw new Error('No pudimos calcular la ruta en auto.')
      }

      const routeData = (await routeResponse.json()) as { routes?: OsrmRoute[] }
      const routes = routeData.routes || []

      if (routes.length === 0) {
        throw new Error('No encontramos una ruta disponible.')
      }

      setRouteResult({
        alternatives: routes.map((route, index) => ({
          coordinates: route.geometry.coordinates.map(([lng, lat]) => ({ lat, lng })),
          distanceMeters: route.distance,
          durationSeconds: route.duration,
          label: index === 0 ? 'Ruta recomendada' : `Alternativa ${index + 1}`,
        })),
        mode: nextMode,
        originLabel: origin.display_name,
        selectedIndex: 0,
      })
    } catch (error) {
      setRouteResult(null)
      setRouteError(error instanceof Error ? error.message : 'No pudimos calcular la ruta.')
    } finally {
      setIsRouting(false)
    }
  }

  function handlePointerDown(event: React.PointerEvent<HTMLDivElement>) {
    if (!hasCoordinates) {
      return
    }

    dragRef.current = {
      center: mapCenter,
      pointerX: event.clientX,
      pointerY: event.clientY,
    }
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  function handlePointerMove(event: React.PointerEvent<HTMLDivElement>) {
    if (!dragRef.current) {
      return
    }

    const deltaX = dragRef.current.pointerX - event.clientX
    const deltaY = dragRef.current.pointerY - event.clientY
    moveMapByPixels(deltaX, deltaY, dragRef.current.center)
  }

  function handlePointerEnd(event: React.PointerEvent<HTMLDivElement>) {
    dragRef.current = null
    event.currentTarget.releasePointerCapture(event.pointerId)
  }

  return (
    <div className="grid gap-5 xl:items-center xl:grid-cols-[minmax(0,1.65fr)_24rem]">
      <div className="overflow-hidden rounded-[1.6rem] border border-border-soft bg-panel shadow-soft">
        <div
          className={cn(
            'relative min-h-[34rem] overflow-hidden bg-[linear-gradient(135deg,rgb(var(--color-panel-muted)),rgb(var(--color-accent-soft)/0.45))] lg:min-h-[39rem]',
            hasCoordinates ? 'cursor-grab touch-none active:cursor-grabbing' : '',
          )}
          onPointerCancel={handlePointerEnd}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerEnd}
          ref={mapRef}
        >
          {hasCoordinates ? (
            <div className="absolute inset-0">
              {mapTiles.map((tile) => (
                <img
                  alt=""
                  className="absolute h-64 w-64 select-none"
                  draggable={false}
                  key={tile.key}
                  src={tile.url}
                  style={{ left: tile.left, top: tile.top }}
                />
              ))}
              <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.12),rgba(255,255,255,0.02)),radial-gradient(circle_at_center,transparent_32%,rgba(12,22,16,0.16))]" />
            </div>
          ) : (
            <div
              className="absolute inset-0 bg-[linear-gradient(135deg,rgb(var(--color-panel-muted)),rgb(var(--color-accent-soft)/0.45)),linear-gradient(90deg,rgb(var(--color-border-soft)/0.38)_1px,transparent_1px),linear-gradient(0deg,rgb(var(--color-border-soft)/0.32)_1px,transparent_1px)] bg-[length:auto,4rem_4rem,4rem_4rem]"
              style={
                config.venue.mapImageUrl
                  ? {
                      backgroundImage: `linear-gradient(135deg,rgba(10,18,14,0.18),rgba(10,18,14,0.04)),url(${config.venue.mapImageUrl})`,
                      backgroundPosition: 'center',
                      backgroundSize: 'cover',
                    }
                  : undefined
              }
            />
          )}

          {routeLinePoints ? (
            <svg className="pointer-events-none absolute inset-0 z-20 h-full w-full">
              <polyline
                fill="none"
                points={routeLinePoints}
                stroke="rgba(12, 23, 18, 0.32)"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="9"
              />
              <polyline
                fill="none"
                points={routeLinePoints}
                stroke="rgb(var(--color-accent))"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="5"
              />
            </svg>
          ) : null}

          <div className="absolute left-8 top-8 z-30 max-w-[18rem] rounded-[1.1rem] border border-border-soft/70 bg-panel/88 px-4 py-3 shadow-soft backdrop-blur">
            <Badge tone="accent">{hasCoordinates ? 'Mapa real' : 'Mapa interactivo'}</Badge>
            <p className="mt-3 font-display text-2xl leading-tight text-text-primary">
              {config.venue.name || fallbackName}
            </p>
            {displayAddress ? (
              <p className="mt-2 text-sm leading-6 text-text-secondary">{displayAddress}</p>
            ) : null}
            {routeUrl ? (
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  className="rounded-full border border-border-soft bg-panel-muted px-3 py-1.5 text-xs font-semibold text-text-primary transition-colors hover:bg-accent-soft"
                  onClick={() => setRouteMode(null)}
                  onPointerDown={stopMapControlEvent}
                  type="button"
                >
                  Volver al mapa
                </button>
                <a
                  className="rounded-full border border-accent/35 bg-accent-soft px-3 py-1.5 text-xs font-semibold text-accent-emphasis transition-colors hover:bg-accent-soft/70"
                  href={routeUrl}
                  rel="noreferrer"
                  target="_blank"
                >
                  Abrir Maps
                </a>
              </div>
            ) : null}
          </div>

          {hasCoordinates ? (
            <div className="absolute right-6 top-6 z-40 grid gap-2">
              <button
                className="grid h-11 w-11 place-items-center rounded-full border border-border-soft bg-panel text-xl font-semibold text-text-primary shadow-soft transition-colors hover:bg-accent-soft"
                onClick={() => zoomBy(1)}
                onPointerDown={stopMapControlEvent}
                type="button"
              >
                +
              </button>
              <button
                className="grid h-11 w-11 place-items-center rounded-full border border-border-soft bg-panel text-xl font-semibold text-text-primary shadow-soft transition-colors hover:bg-accent-soft"
                onClick={() => zoomBy(-1)}
                onPointerDown={stopMapControlEvent}
                type="button"
              >
                -
              </button>
              <button
                className="grid h-11 w-11 place-items-center rounded-full border border-border-soft bg-panel text-sm font-semibold text-text-primary shadow-soft transition-colors hover:bg-accent-soft"
                onClick={recenterVenue}
                onPointerDown={stopMapControlEvent}
                type="button"
              >
                Pin
              </button>
            </div>
          ) : null}

          {hasCoordinates ? (
            <div
              className="absolute bottom-6 right-6 z-40 grid grid-cols-3 gap-2 rounded-[1.45rem] border border-border-soft bg-panel/92 p-3 shadow-soft backdrop-blur"
              onPointerDown={stopMapControlEvent}
            >
              <span />
              <button
                className="h-11 w-11 rounded-xl border border-border-soft bg-panel-muted text-base font-bold text-text-primary transition-colors hover:bg-accent-soft"
                onClick={() => moveMapByPixels(0, -180)}
                type="button"
              >
                ^
              </button>
              <span />
              <button
                className="h-11 w-11 rounded-xl border border-border-soft bg-panel-muted text-base font-bold text-text-primary transition-colors hover:bg-accent-soft"
                onClick={() => moveMapByPixels(-180, 0)}
                type="button"
              >
                &lt;
              </button>
              <button
                className="h-11 w-11 rounded-xl border border-accent-emphasis bg-accent text-base font-bold text-accent-contrast transition-colors hover:bg-accent-emphasis"
                onClick={recenterVenue}
                type="button"
              >
                o
              </button>
              <button
                className="h-11 w-11 rounded-xl border border-border-soft bg-panel-muted text-base font-bold text-text-primary transition-colors hover:bg-accent-soft"
                onClick={() => moveMapByPixels(180, 0)}
                type="button"
              >
                &gt;
              </button>
              <span />
              <button
                className="h-11 w-11 rounded-xl border border-border-soft bg-panel-muted text-base font-bold text-text-primary transition-colors hover:bg-accent-soft"
                onClick={() => moveMapByPixels(0, 180)}
                type="button"
              >
                v
              </button>
              <span />
            </div>
          ) : null}

          {venuePinPosition ? (
            <button
              className="absolute z-30 grid -translate-x-1/2 -translate-y-full place-items-center"
              onClick={recenterVenue}
              onPointerDown={stopMapControlEvent}
              style={{ left: venuePinPosition.left, top: venuePinPosition.top }}
              type="button"
            >
              <span className="relative grid h-16 w-16 place-items-center rounded-full bg-accent text-sm font-bold text-accent-contrast shadow-[0_1rem_2.5rem_rgba(55,91,45,0.36)] after:absolute after:bottom-[-0.55rem] after:h-5 after:w-5 after:rotate-45 after:rounded-sm after:bg-accent">
                Aqui
              </span>
            </button>
          ) : (
            <button
              className="absolute left-1/2 top-1/2 z-10 grid h-14 w-14 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border border-accent/40 bg-accent text-sm font-bold text-accent-contrast shadow-[0_1rem_2.5rem_rgba(55,91,45,0.34)]"
              type="button"
            >
              Aqui
            </button>
          )}

          {visiblePoints.map((point) => {
            const realPosition = getPointPosition(mapCenter, point, mapSize, zoom)
            const pointStyle = realPosition
              ? { left: realPosition.left, top: realPosition.top }
              : { left: `${point.x}%`, top: `${point.y}%` }

            return (
              <button
                className={cn(
                  'absolute z-20 grid h-11 w-11 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border text-xs font-bold shadow-soft transition-[transform,background-color,border-color] duration-300 ease-emphasized hover:scale-110',
                  selectedPoint?.id === point.id
                    ? 'border-accent-emphasis bg-accent text-accent-contrast'
                    : 'border-border-soft bg-panel/92 text-text-primary backdrop-blur',
                )}
                key={point.id}
                onClick={() => setSelectedPointId(point.id)}
                onPointerDown={stopMapControlEvent}
                style={pointStyle}
                type="button"
              >
                {point.label.slice(0, 2).toUpperCase()}
              </button>
            )
          })}

          {hasCoordinates ? (
            <a
              className="absolute bottom-2 left-3 z-40 rounded-full bg-panel/80 px-3 py-1 text-[0.68rem] font-medium text-text-tertiary backdrop-blur hover:text-text-primary"
              href="https://www.openstreetmap.org/copyright"
              rel="noreferrer"
              target="_blank"
            >
              OpenStreetMap
            </a>
          ) : null}
        </div>
      </div>

      <div className="grid content-center gap-4 self-center">
        <div className="rounded-[1.5rem] border border-border-soft bg-panel px-5 py-5 shadow-soft">
          <div className="flex flex-wrap gap-2">
            <button
              className={cn(
                'rounded-full border px-4 py-2 text-sm font-semibold transition-colors',
                selectedCategory === 'all'
                  ? 'border-accent bg-accent text-accent-contrast'
                  : 'border-border-soft bg-panel-muted text-text-secondary',
              )}
              onClick={() => setSelectedCategory('all')}
              type="button"
            >
              Todos
            </button>
            {categories.map((category) => (
              <button
                className={cn(
                  'rounded-full border px-4 py-2 text-sm font-semibold transition-colors',
                  selectedCategory === category
                    ? 'border-accent bg-accent text-accent-contrast'
                    : 'border-border-soft bg-panel-muted text-text-secondary',
                )}
                key={category}
                onClick={() => setSelectedCategory(category)}
                type="button"
              >
                {categoryLabels[category] || category}
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-[1.5rem] border border-border-soft bg-panel px-5 py-5 shadow-soft">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-text-tertiary">
            Punto seleccionado
          </p>
          {selectedPoint ? (
            <div className="mt-4 space-y-3">
              <div>
                <Badge tone="neutral">{getPointLabel(selectedPoint)}</Badge>
                <p className="mt-3 font-display text-3xl leading-tight text-text-primary">
                  {selectedPoint.label}
                </p>
              </div>
              {selectedPoint.description ? (
                <p className="text-sm leading-7 text-text-secondary">{selectedPoint.description}</p>
              ) : null}
              {selectedPoint.address ? (
                <p className="text-sm font-medium text-text-primary">{selectedPoint.address}</p>
              ) : null}
              {selectedPoint.url ? (
                <a
                  className="inline-flex text-sm font-semibold text-accent-emphasis underline-offset-4 hover:underline"
                  href={selectedPoint.url}
                  rel="noreferrer"
                  target="_blank"
                >
                  Abrir referencia
                </a>
              ) : null}
            </div>
          ) : (
            <p className="mt-3 text-sm leading-7 text-text-secondary">
              El administrador aun no ha agregado puntos de referencia.
            </p>
          )}
        </div>

        <div className="rounded-[1.5rem] border border-border-soft bg-[linear-gradient(145deg,rgb(var(--color-panel)),rgb(var(--color-accent-soft)/0.34))] px-5 py-5 shadow-soft">
          <p className="font-display text-2xl text-text-primary">Calcula tu trayecto</p>
          <div className="mt-4 grid gap-3">
            <label className="grid gap-2 text-sm font-medium text-text-secondary">
              Tu direccion
              <input
                className="h-12 rounded-full border border-border-soft bg-panel px-4 text-sm text-text-primary outline-none transition-[border-color,box-shadow] focus:border-accent focus:shadow-[0_0_0_var(--focus-ring-size)_rgb(var(--color-focus-ring)/0.28)]"
                onChange={(event) => {
                  setOriginAddress(event.target.value)
                  setRouteError('')
                  setRouteResult(null)
                  if (!event.target.value.trim()) {
                    setRouteMode(null)
                  }
                }}
                placeholder="Ej: Plaza de Maipu, Santiago"
                value={originAddress}
              />
            </label>
            <div className="flex flex-wrap gap-3">
              <button
                className={cn(
                  'inline-flex h-11 items-center justify-center rounded-full border px-5 text-sm font-semibold transition-colors',
                  canBuildRoute
                    ? 'border-accent bg-accent text-accent-contrast hover:bg-accent-emphasis'
                    : 'pointer-events-none border-border-soft bg-panel-muted text-text-tertiary',
                )}
                disabled={!canBuildRoute}
                onClick={() => {
                  void calculateRoute('driving')
                }}
                type="button"
              >
                {isRouting && routeMode === 'driving'
                  ? 'Calculando...'
                  : routeMode === 'driving'
                    ? 'Ruta en auto activa'
                    : 'Ver tiempo en auto'}
              </button>
              <button
                className={cn(
                  'inline-flex h-11 items-center justify-center rounded-full border px-5 text-sm font-semibold transition-colors',
                  canBuildRoute
                    ? 'border-border-strong bg-panel text-text-primary hover:border-accent/45 hover:bg-accent-soft'
                    : 'pointer-events-none border-border-soft bg-panel-muted text-text-tertiary',
                )}
                disabled={!canBuildRoute}
                onClick={() => {
                  void calculateRoute('transit')
                }}
                type="button"
              >
                {routeMode === 'transit' ? 'Ruta en tren activa' : 'Ver tiempo en tren'}
              </button>
            </div>

            {routeError ? (
              <div className="rounded-[1rem] border border-danger/20 bg-danger-soft/40 px-4 py-3 text-sm leading-6 text-danger">
                {routeError}
              </div>
            ) : null}

            {routeResult ? (
              <div className="grid gap-2">
                {routeResult.alternatives.map((alternative, index) => (
                  <button
                    className={cn(
                      'flex items-center justify-between gap-3 rounded-[1rem] border px-4 py-3 text-left transition-colors',
                      routeResult.selectedIndex === index
                        ? 'border-accent bg-accent-soft text-text-primary'
                        : 'border-border-soft bg-panel/72 text-text-secondary hover:border-accent/35 hover:bg-accent-soft/45',
                    )}
                    key={`${alternative.label}-${index}`}
                    onClick={() =>
                      setRouteResult((current) =>
                        current ? { ...current, selectedIndex: index } : current,
                      )
                    }
                    type="button"
                  >
                    <span>
                      <span className="block text-sm font-semibold text-text-primary">
                        {alternative.label}
                      </span>
                      <span className="block text-xs">
                        {formatRouteDistance(alternative.distanceMeters)}
                      </span>
                    </span>
                    <span className="text-sm font-semibold text-accent-emphasis">
                      {formatRouteDuration(alternative.durationSeconds)}
                    </span>
                  </button>
                ))}
              </div>
            ) : null}

            {routeMode === 'transit' && routeUrl ? (
              <div className="rounded-[1rem] border border-border-soft bg-panel/72 px-4 py-3 text-sm leading-6 text-text-secondary">
                <p>
                  Las opciones de tren y combinaciones dependen de horarios activos de transporte.
                </p>
                <a
                  className="mt-2 inline-flex font-semibold text-accent-emphasis underline-offset-4 hover:underline"
                  href={routeUrl}
                  rel="noreferrer"
                  target="_blank"
                >
                  Ver opciones de tren en Maps
                </a>
              </div>
            ) : null}
          </div>
          {config.venue.mapNotes ? (
            <p className="mt-4 text-sm leading-7 text-text-secondary">{config.venue.mapNotes}</p>
          ) : null}
        </div>
      </div>
    </div>
  )
}
