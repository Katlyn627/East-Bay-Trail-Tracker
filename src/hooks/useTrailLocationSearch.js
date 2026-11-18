import { useState, useEffect, useCallback, useRef } from 'react';
import { EAST_BAY_TRAILS } from '../data/eastBayTrails';
import { CALIFORNIA_TRAILHEADS } from '../data/californiaTrailheads';
import { searchUSGSTrailheads } from '../utils/usgsTrailheadService';

// California-wide bounds
const CALIFORNIA_BOUNDS = {
  north: 42.0,
  south: 32.5,
  west: -124.5,
  east: -114.1,
};

// Combine all local datasets for immediate baseline search
const ALL_LOCAL_DATA = [...EAST_BAY_TRAILS, ...CALIFORNIA_TRAILHEADS];

/**
 * Enhanced Trail Search Hook - California Wide
 * Combines local data, Google Places, USGS NTD, and OpenStreetMap Overpass API.
 */
export default function useTrailLocationSearch(query, options = {}) {
  const { latitude, longitude } = options;
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [hasMore, setHasMore] = useState(false);

  const autocompleteService = useRef(null);
  const placesService = useRef(null);
  const sessionToken = useRef(null);

  // Initialize Google Maps Services
  useEffect(() => {
    const initServices = () => {
      if (window.google?.maps?.places && !autocompleteService.current) {
        autocompleteService.current = new window.google.maps.places.AutocompleteService();
        const dummy = document.createElement('div');
        placesService.current = new window.google.maps.places.PlacesService(dummy);
        sessionToken.current = new window.google.maps.places.AutocompleteSessionToken();
      }
    };

    if (window.google) {
      initServices();
    } else {
      const script = document.querySelector('script[src*="maps.googleapis.com"]');
      if (script) {
        script.addEventListener('load', initServices);
        return () => script.removeEventListener('load', initServices);
      }
    }
  }, []);

  const calculateRank = (name, isTrailhead, isLocal, input) => {
    let rank = 0;
    const nameLower = name.toLowerCase();
    const inputLower = input.toLowerCase();
    const tokens = inputLower.split(/\s+/).filter(t => t.length > 0);

    if (nameLower === inputLower) rank += 1000;

    const words = nameLower.split(/\s+/);
    if (nameLower.startsWith(inputLower) || words.some(w => w.startsWith(inputLower))) {
      rank += 500;
    }

    if (tokens.length > 0 && tokens.every(token => nameLower.includes(token))) {
      rank += 300;
    }

    if (/trailhead|staging area|trail/i.test(name) || isTrailhead) {
      rank += 200;
    }

    if (isLocal) {
      rank += 50;
    }

    return rank;
  };

  const fetchSuggestions = useCallback(async (input) => {
    const normalizedInput = (input || '').trim().toLowerCase();
    if (normalizedInput.length < 1) {
      setSuggestions([]);
      setLoading(false);
      setHasMore(false);
      return;
    }

    const startTime = performance.now();
    setLoading(true);
    setError('');

    // 1. Search Local Combined Dataset
    const localMatches = ALL_LOCAL_DATA.filter(trail => {
      const name = trail.name.toLowerCase();
      const area = (trail.area || '').toLowerCase();
      return name.includes(normalizedInput) || area.includes(normalizedInput);
    }).map(trail => ({
      id: `local-${trail.name.toLowerCase().replace(/\s+/g, '-')}-${trail.latitude}`,
      name: trail.name,
      displayName: `${trail.name}, ${trail.area || 'California'}`,
      latitude: trail.latitude,
      longitude: trail.longitude,
      isTrailhead: trail.type === 'trailhead',
      source: 'local',
      rank: calculateRank(trail.name, trail.type === 'trailhead', !!trail.isLocal, normalizedInput)
    }));

    // 2. Search Google Places API
    const getGoogleResults = () => {
      return new Promise((resolve) => {
        if (!autocompleteService.current) return resolve([]);

        const googleQuery = normalizedInput.includes('trail') || normalizedInput.includes('park')
          ? input
          : `${input} trailhead`;

        const request = {
          input: googleQuery,
          locationBias: CALIFORNIA_BOUNDS,
          sessionToken: sessionToken.current,
          types: ['establishment'],
        };

        autocompleteService.current.getPlacePredictions(request, (predictions, status) => {
          if (status !== window.google.maps.places.PlacesServiceStatus.OK || !predictions) {
            return resolve([]);
          }

          const detailsRequests = predictions.map(prediction => {
            return new Promise((resolveDetail) => {
              placesService.current.getDetails({
                placeId: prediction.place_id,
                fields: ['name', 'geometry', 'types', 'vicinity'],
                sessionToken: sessionToken.current
              }, (place, detailStatus) => {
                if (detailStatus === window.google.maps.places.PlacesServiceStatus.OK && place) {
                  const isTrailhead = place.types?.includes('trailhead') || /trailhead/i.test(place.name);
                  resolveDetail({
                    id: prediction.place_id,
                    name: place.name,
                    displayName: `${place.name}${place.vicinity ? ', ' + place.vicinity : ''}`,
                    latitude: place.geometry?.location?.lat(),
                    longitude: place.geometry?.location?.lng(),
                    isTrailhead: isTrailhead,
                    source: 'google',
                    rank: calculateRank(place.name, isTrailhead, false, normalizedInput)
                  });
                } else {
                  resolveDetail(null);
                }
              });
            });
          });

          Promise.all(detailsRequests).then(results => resolve(results.filter(r => r !== null)));
        });
      });
    };

    // 3. Search Overpass API (OSM)
    const getOverpassResults = async () => {
      if (normalizedInput.length < 3) return [];
      try {
        const query = `[out:json][timeout:5];node["highway"="trailhead"](32.5,-124.5,42.0,-114.1)[name~"${normalizedInput}",i];out body;`;
        const response = await fetch(`https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`);
        const data = await response.json();
        return (data.elements || []).map(el => ({
          id: `osm-${el.id}`,
          name: el.tags.name,
          displayName: `${el.tags.name} (OSM)`,
          latitude: el.lat,
          longitude: el.lon,
          isTrailhead: true,
          source: 'osm',
          rank: calculateRank(el.tags.name, true, false, normalizedInput)
        }));
      } catch (e) {
        return [];
      }
    };

    // 4. Search USGS NTD Layer 35
    const getUSGSResults = async () => {
      const results = await searchUSGSTrailheads(normalizedInput);
      return results.map(res => ({
        ...res,
        rank: calculateRank(res.name, true, false, normalizedInput)
      }));
    };

    try {
      const [googleResults, osmResults, usgsResults] = await Promise.all([
        getGoogleResults(),
        getOverpassResults(),
        getUSGSResults()
      ]);

      const allFound = [...localMatches, ...googleResults, ...osmResults, ...usgsResults];
      const seen = new Set();
      const merged = [];

      allFound.forEach((res, index) => {
        const normalizedName = res.name.toLowerCase().trim();
        const latKey = res.latitude ? res.latitude.toFixed(4) : '0';
        const lngKey = res.longitude ? res.longitude.toFixed(4) : '0';
        const dedupKey = `${normalizedName}-${latKey}-${lngKey}`;

        if (!seen.has(dedupKey)) {
          seen.add(dedupKey);
          // Assign a unique composite key as the ID for React lists
          merged.push({
            ...res,
            id: `${res.source || 'trail'}-${res.id || 'idx'}-${index}`
          });
        }
      });

      const sorted = merged.sort((a, b) => b.rank - a.rank);
      const finalResults = sorted.slice(0, 30);

      const duration = (performance.now() - startTime).toFixed(0);
      console.log(`[Search] Query: "${input}" | Results: ${finalResults.length} | Time: ${duration}ms | Sources: Local(${localMatches.length}) Google(${googleResults.length}) USGS(${usgsResults.length}) OSM(${osmResults.length})`);

      setSuggestions(finalResults);
      setHasMore(sorted.length > 30);
    } catch (err) {
      console.error('Search error:', err);
      setError('Limited search results available.');
      setSuggestions(localMatches.sort((a, b) => b.rank - a.rank).slice(0, 25));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchSuggestions(query);
    }, 150);
    return () => clearTimeout(timer);
  }, [query, fetchSuggestions]);

  return { suggestions, loading, error, hasMore };
}
