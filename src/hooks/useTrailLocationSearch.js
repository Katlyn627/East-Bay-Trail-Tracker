import { useState, useEffect, useCallback, useRef } from 'react';
import { EAST_BAY_TRAILS } from '../data/eastBayTrails';

// East Bay Region Bias for Google Places API
const EAST_BAY_BOUNDS = {
  north: 38.2,
  south: 37.4,
  west: -122.5,
  east: -121.7,
};

/**
 * Enhanced Trail Search Hook
 * Combines local structured East Bay trail data with Google Places API
 * Biases results toward trailheads and trails in the East Bay region.
 */
export default function useTrailLocationSearch(query, options = {}) {
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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

  const fetchSuggestions = useCallback(async (input) => {
    const normalizedInput = (input || '').trim().toLowerCase();
    if (normalizedInput.length < 2) {
      setSuggestions([]);
      return;
    }

    setLoading(true);
    setError('');

    // 1. Search Local East Bay Dataset
    const localMatches = EAST_BAY_TRAILS.filter(trail =>
      trail.name.toLowerCase().includes(normalizedInput) ||
      trail.area.toLowerCase().includes(normalizedInput)
    ).map(trail => ({
      id: `local-${trail.name.toLowerCase().replace(/\s+/g, '-')}`,
      name: trail.name,
      displayName: `${trail.name}, ${trail.area}`,
      latitude: trail.latitude,
      longitude: trail.longitude,
      isTrailhead: trail.type === 'trailhead',
      source: 'local',
      score: trail.type === 'trailhead' ? 0 : 1
    }));

    // 2. Search Google Places API
    if (!autocompleteService.current) {
      setSuggestions(localMatches.slice(0, 8));
      setLoading(false);
      return;
    }

    // Append "trailhead" to query if not present for Google bias
    const googleQuery = normalizedInput.includes('trail') || normalizedInput.includes('park')
      ? input
      : `${input} trailhead`;

    const request = {
      input: googleQuery,
      locationBias: EAST_BAY_BOUNDS,
      sessionToken: sessionToken.current,
      types: ['establishment'],
    };

    autocompleteService.current.getPlacePredictions(request, (predictions, status) => {
      if (status !== window.google.maps.places.PlacesServiceStatus.OK || !predictions) {
        setSuggestions(localMatches.slice(0, 8));
        setLoading(false);
        return;
      }

      // Resolve coordinates for Google predictions
      const googleRequests = predictions.map(prediction => {
        return new Promise((resolve) => {
          placesService.current.getDetails({
            placeId: prediction.place_id,
            fields: ['name', 'geometry', 'types', 'vicinity'],
            sessionToken: sessionToken.current
          }, (place, detailStatus) => {
            if (detailStatus === window.google.maps.places.PlacesServiceStatus.OK && place) {
              const name = place.name;
              const isTrailhead = place.types?.includes('trailhead') || /trailhead/i.test(name);
              const isPark = place.types?.includes('park') || /park/i.test(name);
              const isTrail = /trail|loop|ridge|creek|peak/i.test(name);

              resolve({
                id: prediction.place_id,
                name: name,
                displayName: `${name}${place.vicinity ? ', ' + place.vicinity : ''}`,
                latitude: place.geometry?.location?.lat(),
                longitude: place.geometry?.location?.lng(),
                isTrailhead: isTrailhead,
                source: 'google',
                // Ranking: Trailhead > Trail > Park > Others
                score: isTrailhead ? 0 : (isTrail ? 1 : (isPark ? 2 : 3))
              });
            } else {
              resolve(null);
            }
          });
        });
      });

      Promise.all(googleRequests).then(googleResults => {
        const validGoogleResults = googleResults.filter(r => r !== null);

        // Merge Local and Google, removing duplicates by name
        const seenNames = new Set(localMatches.map(m => m.name.toLowerCase()));
        const merged = [...localMatches];

        validGoogleResults.forEach(res => {
          if (!seenNames.has(res.name.toLowerCase())) {
            merged.push(res);
            seenNames.add(res.name.toLowerCase());
          }
        });

        const finalResults = merged
          .sort((a, b) => a.score - b.score)
          .slice(0, 10);

        setSuggestions(finalResults);
        setLoading(false);
      });
    });
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchSuggestions(query);
    }, 250);
    return () => clearTimeout(timer);
  }, [query, fetchSuggestions]);

  return { suggestions, loading, error };
}
