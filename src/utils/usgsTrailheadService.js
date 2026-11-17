/**
 * USGS National Transportation Dataset (NTD) Trailhead Service
 * Queries Layer 35 (Trailheads) from the National Map ArcGIS REST API.
 * Includes local caching for offline/spotty resilience.
 */

const USGS_BASE_URL = 'https://carto.nationalmap.gov/arcgis/rest/services/transportation/MapServer/35/query';
const CACHE_KEY = 'usgs_trailhead_cache';
const CACHE_TTL = 1000 * 60 * 60 * 24; // 24 hours

export const searchUSGSTrailheads = async (query) => {
  if (!query || query.length < 2) return [];

  // 1. Check Local Cache first
  const cachedData = getCachedResults(query);
  if (cachedData) return cachedData;

  try {
    // 2. Construct ArcGIS REST Query
    // Filtering by name (Feat_Name) and biasing towards California if needed,
    // but here we keep it broad as requested.
    const params = new URLSearchParams({
      where: `UPPER(Feat_Name) LIKE '%${query.toUpperCase()}%'`,
      outFields: 'Feat_Name,State,County',
      outSR: '4326',
      f: 'geojson',
      returnGeometry: 'true',
      resultRecordCount: '50'
    });

    const response = await fetch(`${USGS_BASE_URL}?${params.toString()}`);
    if (!response.ok) throw new Error('USGS API response error');

    const data = await response.json();

    if (!data.features) return [];

    const results = data.features.map(feature => ({
      id: `usgs-${feature.id || Math.random().toString(36).substr(2, 9)}`,
      name: feature.properties.Feat_Name,
      displayName: `${feature.properties.Feat_Name}, ${feature.properties.County || ''} ${feature.properties.State || ''}`.trim().replace(/,$/, ''),
      latitude: feature.geometry.coordinates[1],
      longitude: feature.geometry.coordinates[0],
      source: 'usgs',
      isTrailhead: true
    }));

    // 3. Update Cache
    saveToCache(query, results);

    return results;
  } catch (error) {
    console.error('USGS Search Error:', error);
    // Fallback to cache even if expired if we have it
    return getCachedResults(query, true) || [];
  }
};

function getCachedResults(query, ignoreTTL = false) {
  try {
    const cache = JSON.parse(localStorage.getItem(CACHE_KEY) || '{}');
    const entry = cache[query.toLowerCase()];
    if (entry) {
      if (ignoreTTL || (Date.now() - entry.timestamp < CACHE_TTL)) {
        return entry.data;
      }
    }
  } catch (e) {
    console.warn('Cache read error', e);
  }
  return null;
}

function saveToCache(query, data) {
  try {
    const cache = JSON.parse(localStorage.getItem(CACHE_KEY) || '{}');
    cache[query.toLowerCase()] = {
      data,
      timestamp: Date.now()
    };

    // Simple cache eviction (keep last 50 queries)
    const keys = Object.keys(cache);
    if (keys.length > 50) {
      delete cache[keys[0]];
    }

    localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  } catch (e) {
    console.warn('Cache write error', e);
  }
}
