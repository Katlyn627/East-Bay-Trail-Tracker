import { useState, useEffect, useCallback, useRef } from 'react';

// East Bay Region Bias
const EAST_BAY_BOUNDS = {
  north: 38.2,
  south: 37.4,
  west: -122.5,
  east: -121.7,
};

export default function useGoogleTrailSearch(query, options = {}) {
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const autocompleteService = useRef(null);
  const placesService = useRef(null);
  const sessionToken = useRef(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.google && window.google.maps && window.google.maps.places) {
      autocompleteService.current = new window.google.maps.places.AutocompleteService();
      // Dummy element for PlacesService
      const dummy = document.createElement('div');
      placesService.current = new window.google.maps.places.PlacesService(dummy);
      sessionToken.current = new window.google.maps.places.AutocompleteSessionToken();
    }
  }, []);

  const fetchSuggestions = useCallback(async (input) => {
    if (!input || input.length < 2 || !autocompleteService.current) {
      setSuggestions([]);
      return;
    }

    setLoading(true);
    setError('');

    // Append "trailhead" to query if not present to bias results
    const searchQuery = input.toLowerCase().includes('trailhead')
      ? input
      : `${input} trailhead`;

    const request = {
      input: searchQuery,
      locationBias: EAST_BAY_BOUNDS,
      sessionToken: sessionToken.current,
      // 'establishment' is a broad type, we filter specifically for 'trailhead' or 'park' in types later
      types: ['establishment'],
    };

    autocompleteService.current.getPlacePredictions(request, (predictions, status) => {
      if (status !== window.google.maps.places.PlacesServiceStatus.OK || !predictions) {
        setLoading(false);
        if (status === window.google.maps.places.PlacesServiceStatus.ZERO_RESULTS) {
          setSuggestions([]);
        } else {
          setError('Failed to fetch suggestions');
        }
        return;
      }

      // We need coordinates for each suggestion
      const detailedSuggestions = predictions.map(prediction => {
        return new Promise((resolve) => {
          placesService.current.getDetails({
            placeId: prediction.place_id,
            fields: ['name', 'geometry', 'types', 'vicinity'],
            sessionToken: sessionToken.current
          }, (place, detailStatus) => {
            if (detailStatus === window.google.maps.places.PlacesServiceStatus.OK && place) {
              const isTrailhead = place.types?.includes('trailhead') || /trailhead/i.test(place.name);
              const isPark = place.types?.includes('park') || /park/i.test(place.name);

              resolve({
                id: prediction.place_id,
                name: place.name,
                displayName: `${place.name}${place.vicinity ? ', ' + place.vicinity : ''}`,
                latitude: place.geometry?.location?.lat(),
                longitude: place.geometry?.location?.lng(),
                types: place.types || [],
                isTrailhead,
                isPark,
                // Rank score: trailhead > park > others
                score: isTrailhead ? 0 : (isPark ? 1 : 2)
              });
            } else {
              resolve(null);
            }
          });
        });
      });

      Promise.all(detailedSuggestions).then(results => {
        const filtered = results
          .filter(r => r !== null)
          .sort((a, b) => a.score - b.score);

        setSuggestions(filtered.slice(0, 8));
        setLoading(false);
      });
    });
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchSuggestions(query);
    }, 300);
    return () => clearTimeout(timer);
  }, [query, fetchSuggestions]);

  return { suggestions, loading, error };
}
