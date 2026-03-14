import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Layers, Navigation, Clock, ExternalLink } from 'lucide-react';

type HelpType = 'hospital' | 'police' | 'shelter';

// Mock data
const shelters = [
  { id: 1, name: 'Central Shelter', lat: 34.052, lng: -118.244, type: 'shelter', capacity: 500 },
  { id: 2, name: 'East Medical Center', lat: 34.058, lng: -118.230, type: 'hospital', capacity: 200 },
  { id: 3, name: 'West Relief Camp', lat: 34.045, lng: -118.260, type: 'shelter', capacity: 350 },
  { id: 4, name: 'South Hospital', lat: 34.038, lng: -118.250, type: 'hospital', capacity: 150 },
  { id: 5, name: 'Police Station Alpha', lat: 34.055, lng: -118.255, type: 'police', capacity: 0 },
];

const sosPoints = [
  { id: 1, lat: 34.050, lng: -118.248, type: 'medical', priority: 'critical', msg: 'Trapped under debris - 3 people' },
  { id: 2, lat: 34.047, lng: -118.238, type: 'rescue', priority: 'high', msg: 'Flooding - family on rooftop' },
  { id: 3, lat: 34.060, lng: -118.252, type: 'fire', priority: 'critical', msg: 'Building fire - evacuation needed' },
];

const hazardZones = [
  [34.048, -118.246, 0.8],
  [34.050, -118.242, 0.6],
  [34.046, -118.250, 0.9],
  [34.052, -118.248, 0.5],
  [34.054, -118.240, 0.7],
  [34.044, -118.244, 0.4],
  [34.049, -118.256, 0.6],
  [34.057, -118.250, 0.3],
];

function getDistance(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLng/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

function createIcon(color: string, pulse = false) {
  return L.divIcon({
    className: '',
    html: `<div style="width:14px;height:14px;border-radius:50%;background:${color};border:2px solid rgba(255,255,255,0.8);${pulse ? 'animation:pulse-red 1.5s ease-in-out infinite;box-shadow:0 0 8px ' + color : ''}" ></div>`,
    iconSize: [14, 14],
    iconAnchor: [7, 7],
  });
}

interface MapViewProps {
  tabId: string;
}

interface NearbyPlace {
  id: string;
  name: string;
  lat: number;
  lng: number;
  type: HelpType;
  capacity?: number;
  dist: number;
}

export function MapView({ tabId }: MapViewProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null);
  const layerGroups = useRef<Record<string, L.LayerGroup>>({});
  const userMarkerRef = useRef<L.CircleMarker | null>(null);
  const routeLayerRef = useRef<L.LayerGroup | null>(null);
  const [layers, setLayers] = useState({ hazard: true, rescue: true, support: true });
  const [showLayers, setShowLayers] = useState(false);
  const [userPos, setUserPos] = useState<[number, number] | null>(null);
  const [hasUserLocation, setHasUserLocation] = useState(false);
  const [geoStatus, setGeoStatus] = useState<'idle' | 'locating' | 'active' | 'error' | 'denied'>('idle');
  const [geoError, setGeoError] = useState<string | null>(null);
  const [nearbyPlaces, setNearbyPlaces] = useState<NearbyPlace[] | null>(null);
  const [isLoadingPlaces, setIsLoadingPlaces] = useState(false);
  const [placesError, setPlacesError] = useState<string | null>(null);
  const [routeError, setRouteError] = useState<string | null>(null);

  const nearestHelp: NearbyPlace[] =
    userPos && nearbyPlaces
      ? [...nearbyPlaces]
          .map(p => ({
            ...p,
            dist: getDistance(userPos[0], userPos[1], p.lat, p.lng),
          }))
          .sort((a, b) => a.dist - b.dist)
          .slice(0, 3)
      : [];

  useEffect(() => {
    if (!mapRef.current || mapInstance.current || !userPos) return;

    const map = L.map(mapRef.current, {
      center: userPos,
      zoom: 14,
      zoomControl: true,
    });

    // Satellite basemap (Esri World Imagery)
    L.tileLayer(
      'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      {
        attribution:
          'Imagery &copy; Esri &mdash; Source: Esri, Maxar, Earthstar Geographics, and the GIS User Community',
        maxZoom: 19,
      },
    ).addTo(map);

    // Place names overlay on top of satellite
    L.tileLayer(
      'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}',
      {
        attribution: 'Labels & boundaries &copy; Esri',
        maxZoom: 19,
      },
    ).addTo(map);

    // Hazard layer (circle markers as heatmap substitute)
    const hazardGroup = L.layerGroup();
    hazardZones.forEach(([lat, lng, intensity]) => {
      L.circle([lat as number, lng as number], {
        radius: (intensity as number) * 300,
        color: 'transparent',
        fillColor: '#DC2626',
        fillOpacity: (intensity as number) * 0.35,
      }).addTo(hazardGroup);
    });
    hazardGroup.addTo(map);

    // Rescue layer
    const rescueGroup = L.layerGroup();
    sosPoints.forEach(p => {
      L.marker([p.lat, p.lng], { icon: createIcon('#DC2626', p.priority === 'critical') })
        .bindPopup(`<div style="font-family:IBM Plex Mono,monospace;font-size:11px"><strong>${p.type.toUpperCase()}</strong><br/>${p.msg}<br/><span style="color:#DC2626">${p.priority.toUpperCase()}</span></div>`)
        .addTo(rescueGroup);
    });
    rescueGroup.addTo(map);

    // Support layer (filled with live nearby places when available)
    const supportGroup = L.layerGroup().addTo(map);

    // Dedicated route layer so we can reliably clear old routes
    const routeGroup = L.layerGroup().addTo(map);

    // User position marker (starts at fallback until GPS updates it)
    const userMarker = L.circleMarker(userPos, {
      radius: 6,
      color: '#2563EB',
      fillColor: '#2563EB',
      fillOpacity: 1,
      weight: 2,
    })
      .bindPopup('Your Location')
      .addTo(map);
    userMarkerRef.current = userMarker;

    layerGroups.current = { hazard: hazardGroup, rescue: rescueGroup, support: supportGroup };
    routeLayerRef.current = routeGroup;
    mapInstance.current = map;

    return () => {
      if (routeLayerRef.current) {
        routeLayerRef.current.clearLayers();
        map.removeLayer(routeLayerRef.current);
        routeLayerRef.current = null;
      }
      map.remove();
      mapInstance.current = null;
      userMarkerRef.current = null;
    };
  }, [tabId, userPos]);

  // When userPos changes (from GPS), move marker and re-center
  useEffect(() => {
    const map = mapInstance.current;
    if (!map || !userPos) return;

    if (userMarkerRef.current) {
      userMarkerRef.current.setLatLng(userPos);
    }

    // Zoom in more once we have a real user location for clearer view
    if (hasUserLocation) {
      map.setView(userPos, 16);
    } else {
      map.setView(userPos, map.getZoom());
    }
  }, [userPos, hasUserLocation]);

  // Ask browser for current position
  const requestLocation = () => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setGeoStatus('error');
      setGeoError('This device does not support location services.');
      return;
    }

    setGeoStatus('locating');
    setGeoError(null);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const nextPos: [number, number] = [pos.coords.latitude, pos.coords.longitude];
        setUserPos(nextPos);
        setHasUserLocation(true);
        setGeoStatus('active');
      },
      (err) => {
        if (err.code === err.PERMISSION_DENIED) {
          setGeoStatus('denied');
          setGeoError('Location permission denied. Enable it in browser site settings to use GPS.');
        } else if (err.code === err.POSITION_UNAVAILABLE) {
          setGeoStatus('error');
          setGeoError('Location unavailable. Check GPS or network.');
        } else if (err.code === err.TIMEOUT) {
          setGeoStatus('error');
          setGeoError('Location request timed out. Try again.');
        } else {
          setGeoStatus('error');
          setGeoError('Unknown location error. Try again.');
        }
      },
      {
        enableHighAccuracy: true,
        maximumAge: 10_000,
        timeout: 10_000,
      },
    );
  };

  // Look up nearby police / medical places using OpenStreetMap Overpass API
  useEffect(() => {
    if (!userPos) return;

    const [lat, lng] = userPos;
    const controller = new AbortController();

    async function fetchNearby() {
      setIsLoadingPlaces(true);
      setPlacesError(null);
      try {
        const radiusMeters = 5000; // 5 km radius
        const query = `[out:json][timeout:25];
(
  node["amenity"="police"](around:${radiusMeters},${lat},${lng});
  node["amenity"="hospital"](around:${radiusMeters},${lat},${lng});
  node["amenity"="clinic"](around:${radiusMeters},${lat},${lng});
);
out center 40;`;

        const res = await fetch('https://overpass-api.de/api/interpreter', {
          method: 'POST',
          body: query,
          signal: controller.signal,
          headers: {
            'Content-Type': 'text/plain;charset=UTF-8',
          },
        });

        if (!res.ok) {
          throw new Error(`Overpass error: ${res.status}`);
        }

        const data = await res.json();
        if (!data.elements || !Array.isArray(data.elements)) {
          throw new Error('Unexpected Overpass response');
        }

        const places: NearbyPlace[] = data.elements
          .filter((el: any) => el.tags && el.tags.name && el.lat && el.lon)
          .map((el: any, idx: number) => {
            const amenity: string = el.tags.amenity ?? '';
            let type: HelpType = 'hospital';
            if (amenity === 'police') type = 'police';

            const plat = Number(el.lat);
            const plng = Number(el.lon);

            return {
              id: String(el.id ?? idx),
              name: el.tags.name as string,
              lat: plat,
              lng: plng,
              type,
              dist: getDistance(lat, lng, plat, plng),
            };
          });

        places.sort((a, b) => a.dist - b.dist);
        setNearbyPlaces(places);

        // Update markers in support layer
        const map = mapInstance.current;
        const supportGroup = layerGroups.current['support'];
        if (map && supportGroup) {
          supportGroup.clearLayers();
          places.slice(0, 40).forEach(p => {
            const color = p.type === 'hospital' ? '#2563EB' : p.type === 'police' ? '#7C3AED' : '#16A34A';
            L.marker([p.lat, p.lng], { icon: createIcon(color) })
              .bindPopup(
                `<div style="font-family:IBM Plex Mono,monospace;font-size:11px"><strong>${p.name}</strong><br/>${p.type.toUpperCase()}<br/>${p.dist.toFixed(
                  1,
                )} km away</div>`,
              )
              .addTo(supportGroup);
          });
          if (!map.hasLayer(supportGroup)) {
            map.addLayer(supportGroup);
          }
        }
      } catch (err: any) {
        if (err.name === 'AbortError') return;

        // If live lookup fails (network, CORS, rate limit, etc.),
        // fall back to synthetic nearby locations around the user
        const fallbackAroundUser: NearbyPlace[] = [
          {
            id: 'local-hospital',
            name: 'Nearest Hospital (approx.)',
            lat: lat + 0.01,
            lng: lng + 0.01,
            type: 'hospital',
            dist: getDistance(lat, lng, lat + 0.01, lng + 0.01),
          },
          {
            id: 'local-police',
            name: 'Nearest Police Station (approx.)',
            lat: lat - 0.01,
            lng: lng - 0.01,
            type: 'police',
            dist: getDistance(lat, lng, lat - 0.01, lng - 0.01),
          },
          {
            id: 'local-shelter',
            name: 'Emergency Shelter (approx.)',
            lat: lat + 0.008,
            lng: lng - 0.006,
            type: 'shelter',
            dist: getDistance(lat, lng, lat + 0.008, lng - 0.006),
          },
        ];

        setPlacesError('Live lookup failed, showing approximate nearby locations.');
        setNearbyPlaces(fallbackAroundUser);
      } finally {
        setIsLoadingPlaces(false);
      }
    }

    fetchNearby();

    return () => {
      controller.abort();
    };
  }, [userPos]);

  // Automatically request location once when component mounts
  useEffect(() => {
    requestLocation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const map = mapInstance.current;
    if (!map) return;
    Object.entries(layers).forEach(([key, visible]) => {
      const group = layerGroups.current[key];
      if (!group) return;
      if (visible && !map.hasLayer(group)) map.addLayer(group);
      if (!visible && map.hasLayer(group)) map.removeLayer(group);
    });
  }, [layers]);

  const drawRouteTo = async (place: { lat: number; lng: number }) => {
    const map = mapInstance.current;
    const routeGroup = routeLayerRef.current;
    if (!map || !userPos) {
      setGeoError('Location not ready. Tap "Use My Location" first.');
      return;
    }

    if (!routeGroup) {
      setRouteError('Route layer not ready. Try reloading the map.');
      return;
    }

    setRouteError(null);

    // Remove only previous routes, keep all other map layers intact
    routeGroup.clearLayers();

    try {
      const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${userPos[1]},${userPos[0]};${place.lng},${place.lat}?overview=full&geometries=geojson`;
      const res = await fetch(osrmUrl);

      if (!res.ok) {
        throw new Error(`OSRM error: ${res.status}`);
      }

      const data = await res.json();
      const routeGeom = data?.routes?.[0]?.geometry;

      if (!routeGeom || !routeGeom.coordinates) {
        throw new Error('No route geometry returned');
      }

      const latLngs: [number, number][] = routeGeom.coordinates.map(
        (c: [number, number]) => [c[1], c[0]],
      );

      const route = L.polyline(latLngs, {
        color: '#2563EB',
        weight: 4,
      }).addTo(routeGroup);

      map.fitBounds(route.getBounds(), { padding: [40, 40] });
    } catch (err) {
      setRouteError('Could not fetch road route, showing straight-line path.');

      const route = L.polyline(
        [
          [userPos[0], userPos[1]],
          [place.lat, place.lng],
        ],
        {
          color: '#2563EB',
          weight: 4,
          dashArray: '6 4',
        },
      ).addTo(routeGroup);

      map.fitBounds(route.getBounds(), { padding: [40, 40] });
    }
  };

  const openInMaps = (place: { lat: number; lng: number }) => {
    if (typeof window === 'undefined' || !userPos) {
      setGeoError('Location not ready. Tap "Use My Location" first.');
      return;
    }
    const [ulat, ulng] = userPos;
    const base = 'https://www.google.com/maps/dir/?api=1';
    const url = `${base}&origin=${encodeURIComponent(`${ulat},${ulng}`)}&destination=${encodeURIComponent(
      `${place.lat},${place.lng}`,
    )}`;
    window.open(url, '_blank');
  };

  return (
    <div className="flex h-full relative">
      {/* Map */}
      <div ref={mapRef} className="flex-1 h-full" />

      {/* GPS control + status */}
      <div className="absolute top-3 left-3 z-[1000] space-y-1">
        <button
          onClick={requestLocation}
          className="px-3 py-1.5 rounded-lg bg-card border border-white/[0.08] text-[11px] text-foreground hover:bg-secondary transition-all duration-200 ease-out"
        >
          {geoStatus === 'locating' ? 'Locating…' : hasUserLocation ? 'Re-center on Me' : 'Use My Location'}
        </button>
        {geoError && (
          <p className="max-w-xs rounded-md bg-destructive/10 border border-destructive/40 px-2 py-1 text-[10px] font-mono text-destructive">
            {geoError}
          </p>
        )}
      </div>

      {/* Layer selector overlay */}
      <div className="absolute top-3 right-3 z-[1000]">
        <button
          onClick={() => setShowLayers(p => !p)}
          className="p-2 bg-card border border-white/[0.08] rounded-lg text-foreground hover:bg-secondary transition-all duration-200 ease-out"
        >
          <Layers className="w-4 h-4" />
        </button>
        {showLayers && (
          <div className="mt-1 p-3 bg-card border border-white/[0.08] rounded-[12px] space-y-2 min-w-[160px]">
            <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">Layers</p>
            {[
              { key: 'hazard', label: 'Hazard Zones', color: 'bg-urgent' },
              { key: 'rescue', label: 'SOS Signals', color: 'bg-urgent' },
              { key: 'support', label: 'Help Points', color: 'bg-primary' },
            ].map(l => (
              <label key={l.key} className="flex items-center gap-2 text-xs font-mono cursor-pointer">
                <input
                  type="checkbox"
                  checked={layers[l.key as keyof typeof layers]}
                  onChange={() => setLayers(p => ({ ...p, [l.key]: !p[l.key as keyof typeof p] }))}
                  className="rounded-sm"
                />
                <span className={`w-2 h-2 rounded-full ${l.color}`} />
                {l.label}
              </label>
            ))}
          </div>
        )}
      </div>

      {/* Nearest Help sidebar */}
      <div
        className="w-64 border-l border-white/[0.08] overflow-y-auto flex-shrink-0"
        style={{
          background: 'hsl(240 15% 10% / 0.85)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
        }}
      >
        <div className="p-3 border-b border-subtle border-border">
          <h3 className="font-mono text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <Navigation className="w-3 h-3" /> Quick-Find Nearest
          </h3>
        </div>
        <div className="p-2 space-y-2">
          {routeError && (
            <p className="text-[10px] font-mono text-warning">{routeError}</p>
          )}
          {!hasUserLocation && (
            <p className="text-[10px] font-mono text-muted-foreground">
              Waiting for your location. Click &quot;Use My Location&quot; and allow access.
            </p>
          )}
          {isLoadingPlaces && (
            <p className="text-[10px] font-mono text-muted-foreground">
              Scanning nearby police stations and medical facilities…
            </p>
          )}
          {placesError && (
            <p className="text-[10px] font-mono text-warning">{placesError}</p>
          )}
          {nearestHelp.map(h => (
            <div key={h.id} className="p-3 border border-white/[0.08] rounded-lg space-y-1.5 transition-all duration-200 ease-out hover:border-white/[0.12]">
              <div className="flex items-start justify-between">
                <span className="font-mono text-xs font-medium text-foreground">{h.name}</span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-secondary text-muted-foreground uppercase">
                  {h.type}
                </span>
              </div>
              <div className="flex items-center gap-3 text-[10px] font-mono text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Navigation className="w-2.5 h-2.5" />
                  {h.dist.toFixed(1)} km
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-2.5 h-2.5" />
                  ~{Math.ceil(h.dist * 12)} min
                </span>
              </div>
              <div className="flex gap-1.5">
                <button
                  onClick={() => drawRouteTo(h)}
                  className="flex-1 text-[10px] font-mono py-1 rounded bg-primary text-primary-foreground hover:opacity-90 transition-opacity duration-75"
                >
                  Get Route
                </button>
                <button
                  onClick={() => openInMaps(h)}
                  className="px-2 py-1 rounded bg-success text-success-foreground hover:opacity-90 transition-opacity duration-75"
                >
                  <ExternalLink className="w-2.5 h-2.5" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Active SOS */}
        <div className="p-3 border-t border-subtle border-border">
          <h3 className="font-mono text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Active SOS</h3>
          <div className="space-y-1.5">
            {sosPoints.map(s => (
              <div key={s.id} className="flex items-center gap-2 p-2 rounded-lg border border-white/[0.08]">
                <span className={`w-2 h-2 rounded-full flex-shrink-0 ${s.priority === 'critical' ? 'bg-urgent pulse-urgent' : 'bg-warning'}`} />
                <span className="text-[10px] font-mono text-foreground truncate">{s.msg}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
