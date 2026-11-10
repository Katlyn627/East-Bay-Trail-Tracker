import { useEffect, useMemo, useState } from 'react';

const NOMINATIM_ENDPOINT = 'https://nominatim.openstreetmap.org/search';
const DEBOUNCE_MS = 300;
const CALIFORNIA_VIEWBOX = '-124.482003,42.009518,-114.131211,32.528832';

const CALIFORNIA_TRAIL_FALLBACKS = [
  'Tilden Regional Park',
  'Redwood Regional Park',
  'Mission Peak Regional Preserve',
  'Sibley Volcanic Regional Preserve',
  'Sunol Wilderness Regional Preserve',
  'Mount Tamalpais State Park',
  'Point Reyes National Seashore',
  'Muir Woods National Monument',
  'Lands End Trail',
  'Baylands Nature Preserve',
  'Henry W. Coe State Park',
  'Big Basin Redwoods State Park',
  'Pinnacles National Park',
  'Yosemite National Park',
  'Sequoia National Park',
  'Kings Canyon National Park',
  'Lassen Volcanic National Park',
  'Anza-Borrego Desert State Park',
  'Torrey Pines State Natural Reserve',
  'Topanga State Park',
  'Griffith Park',
  'Runyon Canyon Park',
  'Crystal Cove State Park',
];

const toSuggestionName = (entry) => {
  const namedDetails = entry?.namedetails;
  if (namedDetails?.name) return namedDetails.name;
  if (typeof entry?.display_name === 'string') {
    return entry.display_name.split(',')[0]?.trim() || entry.display_name.trim();
  }
  return '';
};

const toNumber = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const mapNominatimEntryToSuggestion = (entry) => {
  const latitude = toNumber(entry?.lat);
  const longitude = toNumber(entry?.lon);
  if (latitude === null || longitude === null) return null;

  const name = toSuggestionName(entry);
  const displayName = entry?.display_name || name;
  if (!name) return null;

  return {
    id: `nominatim-${entry.place_id || `${name}-${latitude}-${longitude}`}`,
    name,
    displayName,
    latitude,
    longitude,
  };
};

const isCaliforniaResult = (entry) => {
  const address = entry?.address || {};
  const stateValue = `${address.state || ''} ${address.region || ''}`.toLowerCase();
  const display = `${entry?.display_name || ''}`.toLowerCase();
  return stateValue.includes('california') || display.includes('california');
};

const looksLikeTrailOrPark = (entry) => {
  const haystack = `${entry?.display_name || ''} ${entry?.type || ''} ${entry?.class || ''}`.toLowerCase();
  return /(trail|park|wilderness|preserve|forest|open space|state beach|national|regional|recreation)/.test(haystack);
};

const createFallbackSuggestions = (query, limit) => {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) return [];

  return CALIFORNIA_TRAIL_FALLBACKS.filter((name) => name.toLowerCase().includes(normalizedQuery))
    .slice(0, limit)
    .map((name) => ({
      id: `fallback-${name.toLowerCase().replace(/\s+/g, '-')}`,
      name,
      displayName: `${name}, California`,
      latitude: null,
      longitude: null,
    }));
};

const dedupeSuggestions = (entries, limit) => {
  const map = new Map();

  entries.forEach((entry) => {
    if (!entry || !entry.name) return;
    const key = `${entry.name.toLowerCase()}::${entry.latitude ?? ''}::${entry.longitude ?? ''}`;
    if (!map.has(key)) map.set(key, entry);
  });

  return [...map.values()].slice(0, limit);
};

export default function useCaliforniaTrailSearch(query, options = {}) {
  const limit = options.limit ?? 8;
  const minQueryLength = options.minQueryLength ?? 2;
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const normalizedQuery = useMemo(() => query.trim(), [query]);

  useEffect(() => {
    if (normalizedQuery.length < minQueryLength) {
      setSuggestions([]);
      setLoading(false);
      setError('');
      return undefined;
    }

    const controller = new AbortController();
    const timeoutId = window.setTimeout(async () => {
      try {
        setLoading(true);
        setError('');

        const params = new URLSearchParams({
          q: `${normalizedQuery}, California`,
          format: 'jsonv2',
          addressdetails: '1',
          limit: String(limit),
          countrycodes: 'us',
          state: 'California',
          bounded: '1',
          viewbox: CALIFORNIA_VIEWBOX,
        });

        const response = await fetch(`${NOMINATIM_ENDPOINT}?${params.toString()}`, {
          signal: controller.signal,
          headers: {
            Accept: 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error(`Nominatim request failed with status ${response.status}`);
        }

        const data = await response.json();
        const results = Array.isArray(data) ? data : [];
        const californiaResults = results.filter(isCaliforniaResult);
        const trailResults = californiaResults.filter(looksLikeTrailOrPark);
        const mapped = (trailResults.length ? trailResults : californiaResults)
          .map(mapNominatimEntryToSuggestion)
          .filter(Boolean);
        const fallback = createFallbackSuggestions(normalizedQuery, limit);
        setSuggestions(dedupeSuggestions([...mapped, ...fallback], limit));
      } catch (requestError) {
        if (requestError.name === 'AbortError') return;
        console.error('California trail search failed:', requestError);
        const fallback = createFallbackSuggestions(normalizedQuery, limit);
        setSuggestions(fallback);
        setError('Live trail search is temporarily unavailable. Showing directory suggestions.');
      } finally {
        setLoading(false);
      }
    }, DEBOUNCE_MS);

    return () => {
      controller.abort();
      window.clearTimeout(timeoutId);
    };
  }, [limit, minQueryLength, normalizedQuery]);

  return { suggestions, loading, error };
}
