export const STRAVA_SCOPES = 'activity:read_all';

export function buildStravaAuthUrl() {
  const clientId = import.meta.env.VITE_STRAVA_CLIENT_ID;
  const redirectUri =
    import.meta.env.VITE_STRAVA_REDIRECT_URI || `${window.location.origin}/auth/strava/callback`;

  if (!clientId) {
    throw new Error('Please set VITE_STRAVA_CLIENT_ID in your environment to enable Strava OAuth.');
  }

  const params = new URLSearchParams({
    client_id: String(clientId),
    redirect_uri: redirectUri,
    response_type: 'code',
    approval_prompt: 'force',
    scope: STRAVA_SCOPES,
  });

  return `https://www.strava.com/oauth/authorize?${params.toString()}`;
}

export async function exchangeStravaCodeForTokens(code, redirectUri) {
  const exchangeUrl = import.meta.env.VITE_STRAVA_TOKEN_EXCHANGE_URL;

  if (!exchangeUrl) {
    throw new Error(
      'Missing VITE_STRAVA_TOKEN_EXCHANGE_URL. Configure a backend endpoint to exchange the Strava code for tokens.'
    );
  }

  const response = await fetch(exchangeUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      code,
      redirectUri,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || 'Unable to complete Strava OAuth exchange.');
  }

  return response.json();
}

export async function fetchRecentStravaActivities(accessToken) {
  if (!accessToken) {
    throw new Error('No Strava access token available.');
  }

  const response = await fetch('https://www.strava.com/api/v3/athlete/activities?per_page=10&sort=desc', {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error('Unable to fetch recent Strava activities.');
  }

  return response.json();
}
