import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Mail, Lock, Loader, Chrome, Sprout } from 'lucide-react';
import { DEMO_USERS } from '../utils/mockData';

const LogIn = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { logIn, signInWithGoogle, loginDemoAccount } = useAuth();
  const navigate = useNavigate();

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await logIn(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Failed to log in');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    setLoading(true);

    try {
      await signInWithGoogle();
      navigate('/dashboard');
    } catch (err) {
      if (err.code !== 'auth/popup-closed-by-user') {
        setError(err.message || 'Failed to sign in with Google');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async (demoProfile) => {
    setError('');
    setLoading(true);

    try {
      await loginDemoAccount(demoProfile.email);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Unable to switch to the selected demo account.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-sage-mist nature-pattern px-4">
      <div className="w-full max-w-md organic-card p-8 shadow-2xl">
        <div className="mb-6 flex flex-col items-center justify-center gap-3">
          <div className="w-16 h-16 rounded-2xl bg-white shadow-inner flex items-center justify-center overflow-hidden border border-forest-moss/20">
            <img src="/ebtt-app-icon.png" alt="East Bay Trail Tracker icon" className="w-12 h-12 object-contain" />
          </div>
          <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-forest-moss">EAST BAY TRAIL TRACKER</p>
        </div>
        <h1 className="text-3xl font-heading font-black text-forest-deep mb-2 text-center">Welcome Back</h1>
        <p className="text-forest-moss font-medium text-center mb-8">Log in to continue tracking your trail impact</p>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-2xl mb-6 text-sm font-medium animate-shake">
            {error}
          </div>
        )}

        <form onSubmit={handleEmailSubmit} className="space-y-4 mb-8">
          <div>
            <label className="block text-xs font-bold text-forest-deep mb-2 uppercase tracking-widest">Email</label>
            <div className="flex items-center bg-white border-2 border-sage-mist rounded-2xl px-4 py-3 focus-within:border-forest-evergreen transition-colors">
              <Mail size={18} className="text-forest-moss mr-3" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="flex-1 focus:outline-none text-forest-deep placeholder:text-forest-moss/50 bg-transparent"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-forest-deep mb-2 uppercase tracking-widest">Password</label>
            <div className="flex items-center bg-white border-2 border-sage-mist rounded-2xl px-4 py-3 focus-within:border-forest-evergreen transition-colors">
              <Lock size={18} className="text-forest-moss mr-3" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="flex-1 focus:outline-none text-forest-deep placeholder:text-forest-moss/50 bg-transparent"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full btn-nature py-4 flex items-center justify-center gap-2 text-lg shadow-lg"
          >
            {loading ? (
              <>
                <Loader size={20} className="animate-spin" />
                Logging In...
              </>
            ) : (
              'Log In'
            )}
          </button>
        </form>

        <div className="relative mb-8">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-forest-moss/20"></div>
          </div>
          <div className="relative flex justify-center text-xs font-bold uppercase tracking-widest">
            <span className="px-4 bg-white/50 backdrop-blur-sm text-forest-moss">Or continue with</span>
          </div>
        </div>

        <div className="mb-8 space-y-3">
          <div className="mb-2 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-forest-deep">
            <Sprout size={14} className="text-forest" />
            Demo test accounts
          </div>
          {DEMO_USERS.map((demoProfile) => (
            <button
              key={demoProfile.uid}
              type="button"
              onClick={() => handleDemoLogin(demoProfile)}
              disabled={loading}
              className="flex w-full items-center justify-between rounded-2xl border-2 border-sage-mist bg-white/50 px-4 py-3 text-left transition-all hover:border-forest-moss/40 hover:bg-white disabled:opacity-60 group"
            >
              <span>
                <span className="block font-bold text-forest-deep group-hover:text-forest">{demoProfile.displayName}</span>
                <span className="text-[10px] font-bold uppercase tracking-tighter text-forest-moss">{demoProfile.role}</span>
              </span>
              <span className="text-xs font-bold text-poppy">Use account</span>
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={loading}
          className="w-full flex items-center justify-center gap-3 border-2 border-sage-mist rounded-2xl px-4 py-3 text-forest-deep font-bold hover:bg-white hover:border-forest-moss/40 transition-all disabled:opacity-50"
        >
          <Chrome size={20} className="text-forest" />
          Sign in with Google
        </button>

        <p className="text-center text-forest-moss font-medium mt-8">
          Don't have an account?{' '}
          <a href="/signup" className="font-bold text-poppy hover:text-poppy-light underline decoration-2 underline-offset-4">
            Sign Up
          </a>
        </p>
      </div>
    </div>
  );
};

export default LogIn;
