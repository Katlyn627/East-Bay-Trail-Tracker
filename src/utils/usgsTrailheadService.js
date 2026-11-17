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
    // 2. Construct ArcGIS REST Query with California bounding box
    const params = new URLSearchParams({
      where: `UPPER(Feat_Name) LIKE '%${query.toUpperCase()}%'`,
      geometry: '-124.5,32.5,-114.1,42.0', // California bounds
      geometryType: 'esriGeometryEnvelope',
      spatialRel: 'esriSpatialRelIntersects',
      inSR: '4326',
      outFields: 'Feat_Name,State,County',
      outSR: '4326',
      f: 'geojson',
      returnGeometry: 'true',
      resultRecordCount: '50'
    });

    const response = await fetch(`${USGS_BASE_URL}?${params.toString()}`);
    if (!response.ok) {
      // If server error or CORS blocked, return whatever we have in cache
      return getCachedResults(query, true) || [];
    }

    const data = await response.json();
    if (!data || !data.features) {
      return getCachedResults(query, true) || [];
    }

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
    // Silently handle CORS, 403, or offline errors.
    // carto.nationalmap.gov often blocks browser fetch due to missing CORS headers.
    return getCachedResults(query, true) || [];
  }
};

function getCachedResults(query, ignoreTTL = false) {
  try {
    const cache = JSON.parse(localStorage.getItem(CACHE_KEY) || '{}');
    const normalizedQuery = query.toLowerCase();

    // Exact match
    const entry = cache[normalizedQuery];
    if (entry) {
      if (ignoreTTL || (Date.now() - entry.timestamp < CACHE_TTL)) {
        return entry.data;
      }
    }

    // If we are in fallback mode (ignoreTTL = true), search for partial matches in cache
    if (ignoreTTL) {
      const allMatchedData = [];
      Object.keys(cache).forEach(key => {
        if (key.includes(normalizedQuery) || normalizedQuery.includes(key)) {
          allMatchedData.push(...cache[key].data);
        }
      });

      if (allMatchedData.length > 0) {
        // De-duplicate by ID
        return Array.from(new Map(allMatchedData.map(item => [item.id, item])).values());
      }
    }
  } catch (e) {
    // Ignore cache read errors
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

    const keys = Object.keys(cache);
    if (keys.length > 50) {
      delete cache[keys[0]];
    }

    localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  } catch (e) {
    // Ignore cache write errors
  }
}
