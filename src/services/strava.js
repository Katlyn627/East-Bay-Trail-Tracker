export const STRAVA_SCOPES = 'activity:read_all';

export function getStravaRedirectUri() {
  return import.meta.env.VITE_STRAVA_REDIRECT_URI || `${window.location.origin}/auth/strava-callback`;
}

export function buildStravaAuthUrl(userId = '') {
  const clientId = import.meta.env.VITE_STRAVA_CLIENT_ID;
  const redirectUri = getStravaRedirectUri();

  if (!clientId) {
    throw new Error('Please set VITE_STRAVA_CLIENT_ID in your environment to enable Strava OAuth.');
  }

  const params = new URLSearchParams({
    client_id: String(clientId),
    redirect_uri: redirectUri,
    response_type: 'code',
    approval_prompt: 'force',
    scope: STRAVA_SCOPES,
    state: userId,
  });

  return `https://www.strava.com/oauth/authorize?${params.toString()}`;
}

export async function exchangeStravaCodeForTokens(code, redirectUri) {
  const clientId = import.meta.env.VITE_STRAVA_CLIENT_ID;
  const clientSecret = import.meta.env.VITE_STRAVA_CLIENT_SECRET;
  const resolvedRedirectUri = redirectUri || getStravaRedirectUri();

  console.log('DEBUG Strava direct exchange request', {
    client_id: clientId,
    client_secret_present: Boolean(clientSecret),
    code: code ? `${code.slice(0, 12)}...` : null,
    grant_type: 'authorization_code',
    redirect_uri: resolvedRedirectUri,
    using_browser_exchange: true,
  });

  if (!clientId || !clientSecret) {
    throw new Error('Please set VITE_STRAVA_CLIENT_ID and VITE_STRAVA_CLIENT_SECRET in your environment.');
  }

  const requestPayload = {
    client_id: String(clientId),
    client_secret: String(clientSecret),
    code: String(code),
    grant_type: 'authorization_code',
    redirect_uri: String(resolvedRedirectUri),
  };

  const attempts = [
    {
      contentType: 'application/json',
      body: JSON.stringify(requestPayload),
    },
    {
      contentType: 'application/x-www-form-urlencoded',
      body: new URLSearchParams(requestPayload).toString(),
    },
  ];

  let lastError = 'Unable to complete Strava OAuth exchange.';

  for (const attempt of attempts) {
    try {
      const response = await fetch('https://www.strava.com/oauth/token', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': attempt.contentType,
        },
        body: attempt.body,
      });

      const rawText = await response.text();
      let payload;
      try {
        payload = JSON.parse(rawText);
      } catch {
        payload = { raw: rawText };
      }

      console.error('DEBUG Strava direct exchange response', {
        status: response.status,
        ok: response.ok,
        payload,
      });

      if (response.ok) {
        return payload;
      }

      lastError =
        payload?.errors?.[0]?.message ||
        payload?.message ||
        payload?.error ||
        payload?.error_description ||
        rawText ||
        'Unable to complete Strava OAuth exchange.';
    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error);
      console.error('DEBUG Strava request threw', lastError);
    }
  }

  throw new Error(lastError);
}

export async function fetchRecentStravaActivities(accessToken) {
  if (!accessToken) {
    throw new Error('No Strava access token available.');
  }

  const response = await fetch('https://www.strava.com/api/v3/athlete/activities?per_page=10&sort=desc', {
    headers: {
      Authorization: 'Bearer ' + accessToken,
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('DEBUG Strava activities fetch failed', {
      status: response.status,
      body: errorText,
    });
    throw new Error(errorText || 'Unable to fetch recent Strava activities.');
  }

  return response.json();
}
