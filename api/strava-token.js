export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed.' });
  }

  try {
    const { code, redirectUri, redirect_uri } = req.body || {};

    console.log('DEBUG serverless Strava request', {
      hasCode: Boolean(code),
      redirectUri,
      redirect_uri,
      hasClientId: Boolean(process.env.STRAVA_CLIENT_ID),
      hasClientSecret: Boolean(process.env.STRAVA_CLIENT_SECRET),
    });

    if (!code) {
      return res.status(400).json({ error: 'Missing Strava authorization code.' });
    }

    const clientId = process.env.STRAVA_CLIENT_ID;
    const clientSecret = process.env.STRAVA_CLIENT_SECRET;
    const resolvedRedirectUri =
      redirectUri ||
      redirect_uri ||
      process.env.VITE_STRAVA_REDIRECT_URI ||
      'http://localhost:5174/auth/strava-callback';

    if (!clientId || !clientSecret) {
      return res.status(500).json({
        error: 'Missing Strava backend credentials. Set STRAVA_CLIENT_ID and STRAVA_CLIENT_SECRET in your environment.',
      });
    }

    const params = new URLSearchParams({
      client_id: String(clientId),
      client_secret: String(clientSecret),
      code: String(code),
      grant_type: 'authorization_code',
      redirect_uri: String(resolvedRedirectUri),
    });

    const stravaResponse = await fetch('https://www.strava.com/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    const responseText = await stravaResponse.text();
    let payload;
    try {
      payload = JSON.parse(responseText);
    } catch {
      payload = { raw: responseText };
    }

    console.error('DEBUG serverless Strava raw response', {
      status: stravaResponse.status,
      ok: stravaResponse.ok,
      payload,
      raw: responseText,
    });

    if (!stravaResponse.ok) {
      return res.status(stravaResponse.status).json({
        error:
          payload?.errors?.[0]?.message ||
          payload?.message ||
          payload?.error ||
          responseText ||
          'Strava token exchange failed.',
        details: payload,
      });
    }

    return res.status(200).json({
      access_token: payload.access_token,
      refresh_token: payload.refresh_token,
      expires_in: payload.expires_in,
      expires_at: payload.expires_at,
      token_type: payload.token_type,
      athlete: payload.athlete || null,
    });
  } catch (error) {
    console.error('Strava token exchange error:', error);
    return res.status(500).json({
      error: 'Unable to exchange Strava code for tokens.',
      details: error.message,
    });
  }
}
