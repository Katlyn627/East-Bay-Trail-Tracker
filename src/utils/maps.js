const GOOGLE_MAPS_SEARCH_BASE_URL = 'https://www.google.com/maps/search/?api=1&query=';

const toNumber = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

export const normalizeCoordinates = (coordinates) => {
  if (!coordinates || typeof coordinates !== 'object') return null;

  const latitude = toNumber(coordinates.latitude ?? coordinates.lat);
  const longitude = toNumber(coordinates.longitude ?? coordinates.lng ?? coordinates.lon);
  if (latitude === null || longitude === null) return null;

  return { latitude, longitude };
};

export const buildGoogleMapsSearchUrl = (queryText, coordinates) => {
  const normalizedCoordinates = normalizeCoordinates(coordinates);
  const locationQuery = normalizedCoordinates
    ? `${normalizedCoordinates.latitude},${normalizedCoordinates.longitude}`
    : '';
  const fallbackQuery = (queryText || '').trim();
  const finalQuery = locationQuery ? `${locationQuery} ${fallbackQuery}`.trim() : fallbackQuery;
  return `${GOOGLE_MAPS_SEARCH_BASE_URL}${encodeURIComponent(finalQuery)}`;
};
