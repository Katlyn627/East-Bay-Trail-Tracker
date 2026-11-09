import React, { useMemo, useState } from 'react';
import { Activity, CheckCircle2, Loader2, Link2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { buildStravaAuthUrl, fetchRecentStravaActivities } from '../services/strava';

function StravaConnectionCard() {
  const { user, userProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [activities, setActivities] = useState([]);
  const [fetchingActivities, setFetchingActivities] = useState(false);
  const [error, setError] = useState('');

  const stravaProfile = useMemo(() => userProfile?.strava || {}, [userProfile]);

  const handleConnect = () => {
    try {
      window.location.href = buildStravaAuthUrl(user?.uid || '');
    } catch (err) {
      setError(err.message || 'Unable to start the Strava connection flow.');
    }
  };

  const handleFetchActivities = async () => {
    setError('');
    setFetchingActivities(true);

    try {
      const recentActivities = await fetchRecentStravaActivities(stravaProfile.accessToken);
      setActivities(recentActivities.slice(0, 5));
    } catch (err) {
      setError(err.message || 'Unable to fetch recent Strava activities.');
    } finally {
      setFetchingActivities(false);
    }
  };

  return (
    <div className="card mb-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-orange-100 p-3 text-orange-600">
            <Activity size={22} />
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-900">Strava</h3>
            <p className="text-sm text-slate-600">Link your recent runs to cleanup reports.</p>
          </div>
        </div>

        {!stravaProfile.connected ? (
          <button
            type="button"
            onClick={handleConnect}
            disabled={loading}
            className="rounded-xl bg-orange-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {loading ? 'Redirecting...' : 'Connect Strava'}
          </button>
        ) : (
          <span className="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-1 text-sm font-medium text-emerald-700">
            <CheckCircle2 size={16} />
            Connected
          </span>
        )}
      </div>

      {error && <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}

      {stravaProfile.connected ? (
        <div className="mt-5 space-y-4">
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <Link2 size={16} className="text-orange-500" />
            Synced with athlete ID {stravaProfile.athleteId || 'attached'}.
          </div>

          <button
            type="button"
            onClick={handleFetchActivities}
            disabled={fetchingActivities}
            className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {fetchingActivities ? (
              <span className="inline-flex items-center gap-2">
                <Loader2 size={16} className="animate-spin" />
                Loading recent activities...
              </span>
            ) : (
              'Load recent activities'
            )}
          </button>

          {activities.length > 0 && (
            <ul className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
              {activities.map((activity) => (
                <li key={activity.id} className="flex items-center justify-between gap-3 rounded-lg bg-white px-3 py-2 shadow-sm">
                  <div>
                    <p className="font-medium text-slate-800">{activity.name}</p>
                    <p className="text-xs text-slate-500">
                      {new Date(activity.start_date).toLocaleDateString()} • {activity.distance ? `${(activity.distance / 1609.34).toFixed(1)} mi` : 'Distance unavailable'}
                    </p>
                  </div>
                  <span className="rounded-full bg-emerald-100 px-2 py-1 text-xs font-semibold text-emerald-700">
                    {activity.type}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : (
        <p className="mt-4 text-sm text-slate-600">
          Connect your Strava account to attach recent runs or hikes to the cleanup you log.
        </p>
      )}
    </div>
  );
}

export default StravaConnectionCard;
