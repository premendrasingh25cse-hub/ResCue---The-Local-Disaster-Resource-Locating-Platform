import { useEffect, useState, useCallback } from 'react';
import { CloudSun, Wind, AlertTriangle, MapPin, Flag, Globe } from 'lucide-react';
import { useApp } from '@/context/AppContext';

const ORG_NAME = 'ResCue';
const ORG_TAGLINE = 'DISASTER RESPONSE';

type NewsScope = 'Regional' | 'National' | 'Global';

export interface NewsItem {
  id: string;
  title: string;
  timeAgo: string;
  scope: NewsScope;
  source: string;
  url?: string;
}

type FetchNewsOptions = {
  scope: NewsScope;
  detectedState: string | null;
  locationDenied: boolean;
};

const SACHET_CAP_FEED = 'https://sachet.ndma.gov.in/CapFeed';
const RELIEFWEB_REPORTS = 'https://api.reliefweb.int/v1/reports';

/** Fetch URL; if CORS or network fails, try CORS proxies so browser can load cross-origin feed. */
async function fetchTextWithCorsFallback(url: string): Promise<string> {
  try {
    const res = await fetch(url, { mode: 'cors' });
    if (!res.ok) throw new Error(String(res.status));
    return await res.text();
  } catch {
    for (const base of ['https://api.allorigins.win/raw?url=', 'https://corsproxy.io/?']) {
      try {
        const res = await fetch(base + encodeURIComponent(url));
        if (!res.ok) continue;
        const text = await res.text();
        if (text && text.length > 100) return text;
      } catch {
        /* try next proxy */
      }
    }
    throw new Error('Feed unavailable');
  }
}

function timeAgo(isoDate: string): string {
  const d = new Date(isoDate).getTime();
  const mins = Math.max(0, Math.floor((Date.now() - d) / 60_000));
  if (mins < 60) return `${mins}m ago`;
  if (mins < 1440) return `${Math.floor(mins / 60)}h ago`;
  return `${Math.floor(mins / 1440)}d ago`;
}

interface SachetEntry {
  id: string;
  title: string;
  updated: string;
  link: string;
  areaDescs: string;
}

function getAreaDescsFromEntry(entry: Element): string {
  const areaDescs: string[] = [];
  const walk = (node: Element) => {
    if (node.localName === 'areaDesc' || node.localName === 'areadesc') {
      const t = (node.textContent || '').trim();
      if (t) areaDescs.push(t);
    }
    Array.from(node.children).forEach(walk);
  };
  walk(entry);
  if (areaDescs.length > 0) return areaDescs.join(' ');
  const content = entry.querySelector('content');
  if (content?.textContent) return content.textContent;
  return entry.textContent || '';
}

async function fetchSachetFeed(): Promise<SachetEntry[]> {
  const xml = await fetchTextWithCorsFallback(SACHET_CAP_FEED);
  const parser = new DOMParser();
  const doc = parser.parseFromString(xml, 'text/xml');
  const parseError = doc.querySelector('parsererror');
  if (parseError) throw new Error('Invalid feed format');

  const entries: SachetEntry[] = [];
  const items = doc.querySelectorAll('entry, item');
  items.forEach((el, i) => {
    const titleEl = el.querySelector('title');
    const updatedEl = el.querySelector('updated, published, pubDate');
    const linkEl = el.querySelector('link[href]');
    const areaDescs = getAreaDescsFromEntry(el);
    const title = (titleEl?.textContent || '').trim() || 'Alert';
    const updated = (updatedEl?.textContent || '').trim() || new Date().toISOString();
    const link = (linkEl?.getAttribute('href') || linkEl?.getAttribute('url') || '').trim();
    entries.push({
      id: `sachet-${i}-${updated}`,
      title,
      updated,
      link,
      areaDescs: areaDescs.trim(),
    });
  });
  return entries;
}

function sachetToNewsItems(entries: SachetEntry[], scope: NewsScope, filterState?: string | null): NewsItem[] {
  let list = entries;
  if (scope === 'Regional' && filterState) {
    const stateLower = filterState.toLowerCase();
    list = entries.filter(
      (e) =>
        e.areaDescs.toLowerCase().includes(stateLower) ||
        e.title.toLowerCase().includes(stateLower)
    );
  }
  const items = list.slice(0, 20).map((e) => ({
    id: e.id,
    title: e.title,
    timeAgo: timeAgo(e.updated),
    scope,
    source: 'NDMA',
    url: e.link || undefined,
  }));
  if (items.length === 0) {
    return [{
      id: 'ndma-empty',
      title: 'No active alerts in feed at the moment. Check NDMA Sachet for updates.',
      timeAgo: '—',
      scope,
      source: 'NDMA',
      url: SACHET_CAP_FEED,
    }];
  }
  return items;
}

async function fetchJsonWithCorsFallback(url: string): Promise<unknown> {
  try {
    const res = await fetch(url, { mode: 'cors' });
    if (!res.ok) throw new Error(String(res.status));
    return await res.json();
  } catch {
    for (const base of ['https://api.allorigins.win/raw?url=', 'https://corsproxy.io/?']) {
      try {
        const res = await fetch(base + encodeURIComponent(url));
        if (!res.ok) continue;
        const text = await res.text();
        if (!text || text.length < 10) continue;
        return JSON.parse(text) as unknown;
      } catch {
        continue;
      }
    }
    throw new Error('Unavailable');
  }
}

function pickTitle(fields: Record<string, unknown> | undefined): string {
  if (!fields) return 'Report';
  const t = fields.title;
  if (typeof t === 'string') return t.trim();
  if (Array.isArray(t) && t.length > 0 && typeof t[0] === 'string') return String(t[0]).trim();
  return 'Report';
}

function pickDate(fields: Record<string, unknown> | undefined): string | null {
  if (!fields) return null;
  const d = fields.date;
  if (typeof d === 'string') return d;
  if (d && typeof d === 'object' && 'created' in d && typeof (d as { created: string }).created === 'string') return (d as { created: string }).created;
  return null;
}

function pickUrl(fields: Record<string, unknown> | undefined): string | undefined {
  if (!fields) return undefined;
  const u = fields.url;
  if (typeof u === 'string') return u;
  return undefined;
}

async function fetchReliefWebGlobal(): Promise<NewsItem[]> {
  const appnames = ['ResCue', 'rwint-user-0', 'reliefweb'];
  let data: { id?: string; fields?: Record<string, unknown> }[] = [];
  for (const appname of appnames) {
    const url = `${RELIEFWEB_REPORTS}?appname=${encodeURIComponent(appname)}&limit=15&sort[]=date:desc`;
    try {
      const json = (await fetchJsonWithCorsFallback(url)) as { data?: { id?: string; fields?: Record<string, unknown> }[] };
      data = Array.isArray(json?.data) ? json.data : [];
      if (data.length > 0) break;
    } catch {
      continue;
    }
  }
  const items = data.slice(0, 15).map((r, i) => ({
    id: `reliefweb-${r.id ?? i}`,
    title: pickTitle(r.fields),
    timeAgo: pickDate(r.fields) ? timeAgo(pickDate(r.fields)!) : '—',
    scope: 'Global' as NewsScope,
    source: 'ReliefWeb',
    url: pickUrl(r.fields),
  }));
  if (items.length === 0) {
    return [{ id: 'rw-empty', title: 'No global reports at the moment. Open ReliefWeb for latest updates.', timeAgo: '—', scope: 'Global', source: 'ReliefWeb', url: 'https://reliefweb.int/updates?view=reports' }];
  }
  return items;
}

async function fetchNews(options: FetchNewsOptions): Promise<NewsItem[]> {
  const { scope, detectedState, locationDenied } = options;

  if (scope === 'Global') {
    try {
      return await fetchReliefWebGlobal();
    } catch {
      return [
        { id: 'g-fallback', title: 'Live feed unavailable. Open ReliefWeb for the latest global humanitarian reports.', timeAgo: '—', scope: 'Global', source: 'ReliefWeb', url: 'https://reliefweb.int/updates?view=reports' },
      ];
    }
  }

  try {
    const entries = await fetchSachetFeed();
    if (scope === 'National') {
      return sachetToNewsItems(entries, 'National');
    }
    if (scope === 'Regional' && locationDenied) {
      return sachetToNewsItems(entries, 'National');
    }
    if (scope === 'Regional' && detectedState) {
      const regional = sachetToNewsItems(entries, 'Regional', detectedState);
      if (regional.length > 0) return regional;
      return sachetToNewsItems(entries, 'National').slice(0, 10);
    }
    return sachetToNewsItems(entries, 'National');
  } catch {
    return [
      {
        id: 'fallback-1',
        title: 'Official feed could not be reached. Open NDMA Sachet in a new tab to view alerts.',
        timeAgo: '—',
        scope: scope === 'Regional' ? 'National' : scope,
        source: 'NDMA',
        url: SACHET_CAP_FEED,
      },
    ];
  }
}

const defaultWeather = {
  temp: 28,
  condition: 'Partly Cloudy',
  windKmh: 15,
  loading: true,
};

// BigDataCloud response type (principalSubdivision = State name)
interface BigDataCloudReverseGeo {
  principalSubdivision?: string;
  locality?: string;
  city?: string;
}

export function Dashboard() {
  const { setActiveView } = useApp();
  const [dateTime, setDateTime] = useState('');
  const [weather, setWeather] = useState(defaultWeather);
  const [detectedState, setDetectedState] = useState<string | null>(null);
  const [locationDenied, setLocationDenied] = useState(false);
  const [stateDetecting, setStateDetecting] = useState(true);
  const [newsScope, setNewsScope] = useState<NewsScope>('Regional');
  const [newsItems, setNewsItems] = useState<NewsItem[]>([]);
  const [newsLoading, setNewsLoading] = useState(false);

  const loadNews = useCallback(
    async (scope: NewsScope) => {
      setNewsLoading(true);
      try {
        const items = await fetchNews({
          scope,
          detectedState,
          locationDenied,
        });
        setNewsItems(items);
      } finally {
        setNewsLoading(false);
      }
    },
    [detectedState, locationDenied]
  );

  // Live date and time
  useEffect(() => {
    const tick = () => {
      const d = new Date();
      setDateTime(
        d.toLocaleDateString('en-IN', {
          weekday: 'short',
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        }) +
          ' · ' +
          d.toLocaleTimeString('en-IN', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: true,
          })
      );
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  // Geolocation: get lat/lng, then BigDataCloud for state (principalSubdivision). Set locationDenied on permission deny.
  useEffect(() => {
    let cancelled = false;

    if (!navigator.geolocation) {
      setStateDetecting(false);
      setLocationDenied(true);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        if (cancelled) return;
        const { latitude, longitude } = pos.coords;

        try {
          const res = await fetch(
            `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
          );
          if (!res.ok) throw new Error('Reverse geocode failed');
          const data: BigDataCloudReverseGeo = await res.json();
          const state = data?.principalSubdivision?.trim();
          if (!cancelled && state) {
            setDetectedState(state);
          }
        } catch {
          if (!cancelled) setDetectedState(null);
        } finally {
          if (!cancelled) setStateDetecting(false);
        }
      },
      (err) => {
        if (cancelled) return;
        if (err.code === err.PERMISSION_DENIED) {
          setLocationDenied(true);
        }
        setStateDetecting(false);
        setDetectedState(null);
      },
      { timeout: 8000, maximumAge: 300000 }
    );

    return () => {
      cancelled = true;
    };
  }, []);

  // Weather: separate effect so it can run without blocking state detection (optional: use same geolocation)
  useEffect(() => {
    let cancelled = false;
    if (!navigator.geolocation) {
      setWeather({ ...defaultWeather, loading: false });
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        try {
          const res = await fetch(
            `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,weather_code,wind_speed_10m&wind_speed_unit=kmh`
          );
          if (!res.ok) throw new Error('Weather API error');
          const data = await res.json();
          const c = data?.current;
          if (!c) throw new Error('No current weather');
          const conditions: Record<number, string> = {
            0: 'Clear',
            1: 'Mainly Clear',
            2: 'Partly Cloudy',
            3: 'Overcast',
            45: 'Foggy',
            48: 'Foggy',
            51: 'Drizzle',
            61: 'Rain',
            80: 'Rain',
            95: 'Thunderstorm',
          };
          if (!cancelled) {
            setWeather({
              temp: Math.round(c.temperature_2m ?? 28),
              condition: conditions[c.weather_code] ?? 'Partly Cloudy',
              windKmh: Math.round(c.wind_speed_10m ?? 15),
              loading: false,
            });
          }
        } catch {
          if (!cancelled) setWeather({ ...defaultWeather, loading: false });
        }
      },
      () => {
        if (!cancelled) setWeather({ ...defaultWeather, loading: false });
      },
      { timeout: 5000, maximumAge: 300000 }
    );
    return () => {
      cancelled = true;
    };
  }, []);

  // Load news when scope or state/denied state changes
  useEffect(() => {
    if (newsScope === 'Regional' && stateDetecting) return;
    loadNews(newsScope);
  }, [newsScope, detectedState, locationDenied, stateDetecting, loadNews]);

  const scopeIcon = { Regional: MapPin, National: Flag, Global: Globe };

  const showRegionalSkeleton = newsScope === 'Regional' && stateDetecting;
  const showLocationNotice = newsScope === 'Regional' && locationDenied;

  return (
    <div className="h-full overflow-y-auto bg-background">
      <div className="h-0.5 bg-primary" />

      <div className="p-4 md:p-6 lg:p-8 flex flex-col lg:flex-row gap-6 lg:gap-8 max-w-6xl mx-auto">
        <div className="flex-1 min-w-0 space-y-6">
          <header className="space-y-1">
            <h1 className="text-2xl md:text-3xl font-medium tracking-tight text-[#E1E1E1]" style={{ fontFamily: 'Inter, sans-serif' }}>
              {ORG_NAME}
            </h1>
            <p className="text-xs text-muted-foreground uppercase tracking-widest" style={{ fontFamily: 'Inter, sans-serif' }}>
              {ORG_TAGLINE}
            </p>
            <p className="text-sm text-muted-foreground tabular-nums" style={{ fontFamily: 'Inter, sans-serif' }} aria-live="polite">
              {dateTime || '—'}
            </p>
          </header>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-card rounded-[12px] p-6 space-y-4 border border-white/[0.08] transition-all duration-200 ease-out hover:border-white/[0.12]">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground uppercase tracking-wider" style={{ fontFamily: 'Inter, sans-serif' }}>
                  Weather
                </span>
                <CloudSun className="w-5 h-5 text-primary" />
              </div>
              {weather.loading ? (
                <p className="text-sm text-muted-foreground" style={{ fontFamily: 'Inter, sans-serif' }}>Loading…</p>
              ) : (
                <>
                  <p className="text-3xl font-medium text-[#E1E1E1] tabular-nums" style={{ fontFamily: 'Inter, sans-serif' }}>
                    {weather.temp}°C
                  </p>
                  <p className="text-sm text-muted-foreground" style={{ fontFamily: 'Inter, sans-serif' }}>{weather.condition}</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground" style={{ fontFamily: 'Inter, sans-serif' }}>
                    <Wind className="w-3.5 h-3.5" />
                    <span>Wind {weather.windKmh} km/h</span>
                  </div>
                </>
              )}
            </div>

            <div className="bg-card rounded-[12px] p-6 flex flex-col justify-center border border-white/[0.08] transition-all duration-200 ease-out hover:border-white/[0.12]">
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-3" style={{ fontFamily: 'Inter, sans-serif' }}>
                Emergency
              </p>
              <button
                type="button"
                onClick={() => setActiveView('sos')}
                className="sos-glow w-full flex items-center justify-center gap-3 py-4 px-5 rounded-[12px] text-sm font-medium uppercase tracking-wider bg-urgent text-urgent-foreground hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-urgent focus:ring-offset-2 focus:ring-offset-background transition-all duration-200 ease-out border border-urgent/50"
                style={{ fontFamily: 'Inter, sans-serif' }}
              >
                <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                SOS Triage — Send Alert
              </button>
              <p className="text-[10px] text-muted-foreground mt-2 text-center" style={{ fontFamily: 'Inter, sans-serif' }}>
                Opens emergency triage flow
              </p>
            </div>
          </div>
        </div>

        <aside
          className="w-full lg:w-80 flex-shrink-0 flex flex-col rounded-[12px] overflow-hidden border border-white/[0.08]"
          style={{
            background: 'hsl(240 15% 10% / 0.6)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
          }}
        >
          <div className="p-4 border-b border-white/[0.08] text-xs text-muted-foreground uppercase tracking-wider" style={{ fontFamily: 'Inter, sans-serif' }}>
            News Feed
          </div>
          <div className="flex border-b border-white/[0.08]">
            {(['Regional', 'National', 'Global'] as const).map((tab) => {
              const Icon = scopeIcon[tab];
              return (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setNewsScope(tab)}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-[11px] transition-all duration-200 ease-out ${
                    newsScope === tab
                      ? 'text-primary border-b-2 border-primary bg-white/5'
                      : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
                  }`}
                  style={{ fontFamily: 'Inter, sans-serif' }}
                >
                  {tab === 'Regional' && (
                    <span
                      className="w-1.5 h-1.5 rounded-full bg-urgent pulse-dot"
                      title="Real-time"
                      aria-hidden
                    />
                  )}
                  <Icon className="w-3 h-3" />
                  {tab}
                </button>
              );
            })}
          </div>
          <div
            className="flex-1 overflow-y-auto min-h-0"
            style={{ maxHeight: 'min(420px, 50vh)' }}
          >
            {showLocationNotice && (
              <p className="p-3 text-[10px] text-warning border-b border-white/[0.08] bg-warning/10" style={{ fontFamily: 'Inter, sans-serif' }}>
                Enable location for state-specific alerts
              </p>
            )}
            {showRegionalSkeleton ? (
              <NewsFeedSkeleton />
            ) : newsLoading ? (
              <div className="p-4 text-xs text-muted-foreground" style={{ fontFamily: 'Inter, sans-serif' }}>Loading…</div>
            ) : (
              <ul className="p-2 space-y-2">
                {newsItems.map((item) => {
                  const Icon = scopeIcon[item.scope];
                  return (
                    <li key={item.id}>
                      <article
                        className="p-3 rounded-lg text-left transition-all duration-200 ease-out hover:bg-white/5 border border-white/[0.08]"
                        style={{ fontFamily: 'Inter, sans-serif' }}
                      >
                        <div className="flex items-start gap-2">
                          {item.scope === 'Regional' && (
                            <span
                              className="w-1.5 h-1.5 rounded-full bg-urgent flex-shrink-0 mt-1.5 pulse-dot"
                              title="Regional urgency"
                              aria-hidden
                            />
                          )}
                          <div className="min-w-0 flex-1">
                            <p className="text-xs text-[#E1E1E1] leading-snug">{item.title}</p>
                            <div className="flex items-center gap-2 mt-1.5 text-[10px] text-muted-foreground">
                              <span className="tabular-nums">{item.timeAgo}</span>
                              <Icon className="w-3 h-3 flex-shrink-0" />
                            </div>
                            {item.source && item.source !== '—' && (
                              <p className="mt-1 text-[10px] text-primary/90">
                                Official source: {item.url ? (
                                  <a href={item.url} target="_blank" rel="noopener noreferrer" className="underline hover:opacity-90">{item.source}</a>
                                ) : (
                                  item.source
                                )}
                              </p>
                            )}
                          </div>
                          {item.scope !== 'Regional' && (
                            <Icon className="w-3.5 h-3.5 text-muted-foreground/70 flex-shrink-0" />
                          )}
                        </div>
                      </article>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}

function NewsFeedSkeleton() {
  return (
    <ul className="p-2 space-y-2">
      {[1, 2, 3, 4].map((i) => (
        <li
          key={i}
          className="p-3 rounded-lg animate-pulse border border-white/[0.08]"
        >
          <div className="h-3 bg-muted rounded w-full mb-2" />
          <div className="h-2.5 bg-muted rounded w-16" />
        </li>
      ))}
    </ul>
  );
}
