import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { exchangeStravaCodeForTokens } from '../services/strava';

function StravaAuthCallback() {
  const navigate = useNavigate();
  const { user, userProfile, updateUserProfile } = useAuth();
  const [status, setStatus] = useState('Connecting your Strava account...');
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    const runCallback = async () => {
      const params = new URLSearchParams(window.location.search);
      const code = params.get('code');

      if (!user) {
        setIsError(true);
        setStatus('You must be logged in before connecting Strava.');
        setTimeout(() => navigate('/login'), 2000);
        return;
      }

      if (!code) {
        setIsError(true);
        setStatus('Strava did not return an authorization code.');
        setTimeout(() => navigate('/dashboard'), 2000);
        return;
      }

      try {
        const redirectUri = `${window.location.origin}/auth/strava/callback`;
        const result = await exchangeStravaCodeForTokens(code, redirectUri);

        if (!result || !result.access_token) {
          throw new Error('Strava did not return an access token.');
        }

        const stravaRecord = {
          ...(userProfile?.strava || {}),
          connected: true,
          accessToken: result.access_token,
          refreshToken: result.refresh_token,
          expiresAt: Date.now() + Number(result.expires_in || 0) * 1000,
          athleteId: result.athlete?.id || null,
          connectedAt: new Date().toISOString(),
          lastSyncedAt: new Date().toISOString(),
        };

        await updateUserProfile({ strava: stravaRecord });
        setStatus('Strava connected successfully. Redirecting to your dashboard...');
        setTimeout(() => navigate('/dashboard'), 1800);
      } catch (err) {
        setIsError(true);
        setStatus(err.message || 'Unable to connect Strava right now.');
        setTimeout(() => navigate('/dashboard'), 2500);
      }
    };

    runCallback();
  }, [navigate, updateUserProfile, user, userProfile]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-xl">
        {isError ? (
          <AlertCircle size={40} className="mx-auto mb-4 text-red-500" />
        ) : (
          <Loader2 size={40} className="mx-auto mb-4 animate-spin text-orange-500" />
        )}

        <h1 className="mb-2 text-2xl font-bold text-slate-900">{isError ? 'Strava connection issue' : 'Connecting Strava'}</h1>
        <p className="text-sm text-slate-600">{status}</p>

        {!isError && (
          <div className="mt-5 flex items-center justify-center gap-2 text-emerald-600">
            <CheckCircle2 size={18} />
            <span className="text-sm font-medium">Security token exchange in progress</span>
          </div>
        )}
      </div>
    </div>
  );
}

export default StravaAuthCallback;
