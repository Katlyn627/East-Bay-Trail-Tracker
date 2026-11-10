import { useMemo } from 'react';

const CALIFORNIA_TRAIL_DATASET = [
  // East Bay + Bay Area
  { name: 'Tilden Regional Park', area: 'Berkeley, East Bay', latitude: 37.8926, longitude: -122.2439 },
  { name: 'Redwood Regional Park', area: 'Oakland, East Bay', latitude: 37.8111, longitude: -122.1551 },
  { name: 'Mission Peak Regional Preserve', area: 'Fremont, East Bay', latitude: 37.5121, longitude: -121.8805 },
  { name: 'Sunol Wilderness Regional Preserve', area: 'Sunol, East Bay', latitude: 37.515, longitude: -121.8176 },
  { name: 'Anthony Chabot Regional Park', area: 'Castro Valley, East Bay', latitude: 37.7531, longitude: -122.1004 },
  { name: 'Briones Regional Park', area: 'Lafayette / Orinda, East Bay', latitude: 37.9246, longitude: -122.1456 },
  { name: 'Mount Diablo State Park', area: 'Contra Costa County, East Bay', latitude: 37.8816, longitude: -121.9142 },
  { name: 'Sibley Volcanic Regional Preserve', area: 'Oakland Hills, East Bay', latitude: 37.8498, longitude: -122.1791 },
  { name: 'Wildcat Canyon Regional Park', area: 'Richmond, East Bay', latitude: 37.9629, longitude: -122.2538 },
  { name: 'Joaquin Miller Park', area: 'Oakland, East Bay', latitude: 37.8128, longitude: -122.1844 },
  { name: 'Claremont Canyon Regional Preserve', area: 'Berkeley / Oakland Hills', latitude: 37.8556, longitude: -122.2201 },
  { name: 'Coyote Hills Regional Park', area: 'Fremont, East Bay', latitude: 37.5531, longitude: -122.0956 },
  { name: 'Del Valle Regional Park', area: 'Livermore, East Bay', latitude: 37.5851, longitude: -121.7429 },
  { name: 'Pleasanton Ridge Regional Park', area: 'Pleasanton, East Bay', latitude: 37.6518, longitude: -121.8994 },
  { name: 'Black Diamond Mines Regional Preserve', area: 'Antioch, East Bay', latitude: 37.9662, longitude: -121.8281 },
  { name: 'Las Trampas Regional Wilderness', area: 'San Ramon, East Bay', latitude: 37.8274, longitude: -121.9905 },
  { name: 'Martin Luther King Jr. Regional Shoreline', area: 'Oakland, East Bay', latitude: 37.7388, longitude: -122.2193 },
  { name: 'Point Isabel Regional Shoreline', area: 'Richmond, East Bay', latitude: 37.9019, longitude: -122.3178 },
  { name: 'Mori Point', area: 'Pacifica, Bay Area', latitude: 37.6162, longitude: -122.4979 },
  { name: 'Rancho San Antonio Preserve', area: 'Cupertino / Los Altos, Bay Area', latitude: 37.3327, longitude: -122.0873 },
  { name: 'Windy Hill Open Space Preserve', area: 'Portola Valley, Bay Area', latitude: 37.3728, longitude: -122.2416 },
  { name: 'Foothills Nature Preserve', area: 'Palo Alto, Bay Area', latitude: 37.3571, longitude: -122.1965 },
  { name: 'Edgewood Park and Natural Preserve', area: 'Redwood City, Bay Area', latitude: 37.4696, longitude: -122.2972 },
  { name: 'Alum Rock Park', area: 'San Jose, Bay Area', latitude: 37.3924, longitude: -121.8095 },
  { name: 'Castle Rock State Park', area: 'Santa Cruz Mountains, Bay Area', latitude: 37.2308, longitude: -122.1131 },
  { name: 'Henry W. Coe State Park', area: 'Morgan Hill, Bay Area', latitude: 37.1887, longitude: -121.5394 },
  { name: 'Mount Tamalpais State Park', area: 'Marin County, Bay Area', latitude: 37.923, longitude: -122.5968 },
  { name: 'Point Reyes National Seashore', area: 'Marin County, Bay Area', latitude: 38.0731, longitude: -122.8068 },
  { name: 'Muir Woods National Monument', area: 'Marin County, Bay Area', latitude: 37.8969, longitude: -122.5817 },
  { name: 'Tennessee Valley Trailhead', area: 'Mill Valley, Bay Area', latitude: 37.8606, longitude: -122.5386 },
  { name: 'Lands End Trail', area: 'San Francisco, Bay Area', latitude: 37.7802, longitude: -122.5135 },
  { name: 'Golden Gate Park Trails', area: 'San Francisco, Bay Area', latitude: 37.7694, longitude: -122.4862 },
  { name: 'Presidio Ecology Trail', area: 'San Francisco, Bay Area', latitude: 37.7989, longitude: -122.4662 },
  { name: 'Mount Sutro Open Space Reserve', area: 'San Francisco, Bay Area', latitude: 37.7582, longitude: -122.4588 },
  { name: 'China Camp State Park', area: 'San Rafael, Bay Area', latitude: 38.0076, longitude: -122.4661 },
  { name: 'Angel Island State Park', area: 'Marin County, Bay Area', latitude: 37.8633, longitude: -122.4328 },
  { name: 'Samuel P. Taylor State Park', area: 'Marin County, Bay Area', latitude: 38.0121, longitude: -122.7362 },
  { name: 'Big Basin Redwoods State Park', area: 'Santa Cruz County, Bay Area', latitude: 37.1725, longitude: -122.2226 },
  { name: 'Nisene Marks State Park', area: 'Aptos, Bay Area', latitude: 37.0042, longitude: -121.8749 },

  // Northern California + Sierra
  { name: 'Yosemite National Park', area: 'Sierra Nevada', latitude: 37.8651, longitude: -119.5383 },
  { name: 'Sequoia National Park', area: 'Sierra Nevada', latitude: 36.4864, longitude: -118.5658 },
  { name: 'Kings Canyon National Park', area: 'Sierra Nevada', latitude: 36.8879, longitude: -118.5551 },
  { name: 'Lassen Volcanic National Park', area: 'Northern California', latitude: 40.4977, longitude: -121.4207 },
  { name: 'Pinnacles National Park', area: 'Central California', latitude: 36.4906, longitude: -121.1825 },
  { name: 'Lake Tahoe Rim Trail', area: 'Tahoe Basin', latitude: 39.0968, longitude: -120.0324 },
  { name: 'Desolation Wilderness', area: 'Tahoe Basin', latitude: 38.9347, longitude: -120.1182 },
  { name: 'Donner Memorial State Park', area: 'Truckee, Sierra', latitude: 39.3276, longitude: -120.2389 },
  { name: 'Mount Shasta Wilderness', area: 'Siskiyou County', latitude: 41.4092, longitude: -122.1942 },
  { name: 'Castle Crags State Park', area: 'Shasta County', latitude: 41.1515, longitude: -122.3156 },
  { name: 'Burney Falls State Park', area: 'Shasta County', latitude: 41.0115, longitude: -121.6514 },
  { name: 'Trinity Alps Wilderness', area: 'North Coast Ranges', latitude: 41.1032, longitude: -122.9878 },
  { name: 'Jedediah Smith Redwoods State Park', area: 'Del Norte County', latitude: 41.7931, longitude: -124.0797 },
  { name: 'Prairie Creek Redwoods State Park', area: 'Humboldt County', latitude: 41.3986, longitude: -124.0284 },
  { name: 'Humboldt Redwoods State Park', area: 'Humboldt County', latitude: 40.3096, longitude: -123.9968 },
  { name: 'Russian Gulch State Park', area: 'Mendocino County', latitude: 39.332, longitude: -123.8078 },
  { name: 'Mendocino Headlands State Park', area: 'Mendocino County', latitude: 39.3134, longitude: -123.8022 },
  { name: 'Salt Point State Park', area: 'Sonoma Coast', latitude: 38.5766, longitude: -123.3292 },
  { name: 'Sonoma Coast State Park', area: 'Sonoma Coast', latitude: 38.4087, longitude: -123.0992 },
  { name: 'Armstrong Redwoods State Natural Reserve', area: 'Sonoma County', latitude: 38.5171, longitude: -122.998 },
  { name: 'Annadel State Park', area: 'Santa Rosa', latitude: 38.4545, longitude: -122.6536 },
  { name: 'Bothe-Napa Valley State Park', area: 'Napa Valley', latitude: 38.5291, longitude: -122.4824 },

  // Central Coast + Southern California
  { name: 'Big Sur Coast Trails', area: 'Monterey County', latitude: 36.2704, longitude: -121.8081 },
  { name: 'Julia Pfeiffer Burns State Park', area: 'Big Sur', latitude: 36.1581, longitude: -121.6708 },
  { name: 'Andrew Molera State Park', area: 'Big Sur', latitude: 36.2823, longitude: -121.8441 },
  { name: 'Pfeiffer Big Sur State Park', area: 'Big Sur', latitude: 36.2484, longitude: -121.7802 },
  { name: 'Point Lobos State Natural Reserve', area: 'Carmel', latitude: 36.5162, longitude: -121.9401 },
  { name: 'Garland Ranch Regional Park', area: 'Monterey County', latitude: 36.5258, longitude: -121.7964 },
  { name: 'Montana de Oro State Park', area: 'San Luis Obispo County', latitude: 35.2734, longitude: -120.8849 },
  { name: 'Morro Bay State Park', area: 'San Luis Obispo County', latitude: 35.3413, longitude: -120.8275 },
  { name: 'Los Padres National Forest Trails', area: 'Central Coast', latitude: 34.7574, longitude: -119.5966 },
  { name: 'Channel Islands National Park', area: 'Ventura County Coast', latitude: 34.0069, longitude: -119.7785 },
  { name: 'Topanga State Park', area: 'Santa Monica Mountains', latitude: 34.1067, longitude: -118.5881 },
  { name: 'Malibu Creek State Park', area: 'Santa Monica Mountains', latitude: 34.1106, longitude: -118.7266 },
  { name: 'Runyon Canyon Park', area: 'Los Angeles', latitude: 34.1109, longitude: -118.3504 },
  { name: 'Griffith Park Trails', area: 'Los Angeles', latitude: 34.1366, longitude: -118.2942 },
  { name: 'Eaton Canyon Natural Area', area: 'Pasadena', latitude: 34.1826, longitude: -118.0975 },
  { name: 'Crystal Cove State Park', area: 'Orange County', latitude: 33.5669, longitude: -117.8427 },
  { name: 'Torrey Pines State Natural Reserve', area: 'San Diego County', latitude: 32.9207, longitude: -117.2528 },
  { name: 'Mission Trails Regional Park', area: 'San Diego', latitude: 32.8406, longitude: -117.0428 },
  { name: 'Anza-Borrego Desert State Park', area: 'San Diego County Desert', latitude: 33.255, longitude: -116.3753 },
  { name: 'Joshua Tree National Park', area: 'Southern California Desert', latitude: 33.8734, longitude: -115.901 },
  { name: 'Mount San Jacinto State Park', area: 'Riverside County', latitude: 33.815, longitude: -116.6794 },
  { name: 'Santa Rosa and San Jacinto Mountains National Monument', area: 'Coachella Valley', latitude: 33.7878, longitude: -116.4271 },
];

const toSearchHaystack = (entry) =>
  `${entry.name} ${entry.area || ''}`.toLowerCase();

const buildSuggestion = (entry) => ({
  id: `${entry.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${entry.latitude}-${entry.longitude}`,
  name: entry.name,
  displayName: entry.area ? `${entry.name}, ${entry.area}` : entry.name,
  latitude: entry.latitude ?? null,
  longitude: entry.longitude ?? null,
});

const scoreEntry = (entry, queryValue) => {
  const lowerName = entry.name.toLowerCase();
  const lowerArea = (entry.area || '').toLowerCase();

  if (lowerName.startsWith(queryValue)) return 0;
  if (lowerArea.startsWith(queryValue)) return 1;
  if (lowerName.includes(queryValue)) return 2;
  if (lowerArea.includes(queryValue)) return 3;
  return 4;
};

export default function useCaliforniaTrailSearch(query, options = {}) {
  const limit = options.limit ?? 8;
  const minQueryLength = options.minQueryLength ?? 1;
  const normalizedQuery = (query || '').trim().toLowerCase();

  const suggestions = useMemo(() => {
    if (normalizedQuery.length < minQueryLength) return [];

    const matches = CALIFORNIA_TRAIL_DATASET.filter((entry) =>
      toSearchHaystack(entry).includes(normalizedQuery)
    )
      .sort((a, b) => {
        const scoreDifference = scoreEntry(a, normalizedQuery) - scoreEntry(b, normalizedQuery);
        if (scoreDifference !== 0) return scoreDifference;
        return a.name.localeCompare(b.name);
      })
      .slice(0, limit)
      .map(buildSuggestion);

    return matches;
  }, [limit, minQueryLength, normalizedQuery]);

  return { suggestions, loading: false, error: '' };
}
