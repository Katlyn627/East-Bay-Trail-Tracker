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
    <div className="flex min-h-screen items-center justify-center bg-[#F4F6F0] px-4">
      <div className="w-full max-w-md rounded-lg border border-[#D4A373]/30 bg-white p-8 shadow-xl">
        <h1 className="text-3xl font-bold text-dark mb-2 text-center">Welcome Back</h1>
        <p className="text-gray-600 text-center mb-6">Log in to continue tracking your trail impact</p>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleEmailSubmit} className="space-y-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-dark mb-1">Email</label>
            <div className="flex items-center border border-gray-300 rounded-lg px-3 py-2 focus-within:ring-2 focus-within:ring-primary focus-within:border-transparent">
              <Mail size={18} className="text-gray-400 mr-2" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="flex-1 focus:outline-none"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-dark mb-1">Password</label>
            <div className="flex items-center border border-gray-300 rounded-lg px-3 py-2 focus-within:ring-2 focus-within:ring-primary focus-within:border-transparent">
              <Lock size={18} className="text-gray-400 mr-2" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="flex-1 focus:outline-none"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full btn-primary flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader size={18} className="animate-spin" />
                Logging In...
              </>
            ) : (
              'Log In'
            )}
          </button>
        </form>

        <div className="relative mb-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-gray-500">Or continue with</span>
          </div>
        </div>

        <div className="mb-6 space-y-2">
          <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#1B4332]">
            <Sprout size={14} />
            Demo test accounts
          </div>
          {DEMO_USERS.map((demoProfile) => (
            <button
              key={demoProfile.uid}
              type="button"
              onClick={() => handleDemoLogin(demoProfile)}
              disabled={loading}
              className="flex w-full items-center justify-between rounded-xl border border-[#D4A373]/35 bg-[#F8FBF8] px-3 py-2 text-left text-sm font-medium text-[#1B4332] transition hover:border-[#52B788]/45 hover:bg-[#edf9f2] disabled:opacity-60"
            >
              <span>
                <span className="block font-semibold">{demoProfile.displayName}</span>
                <span className="text-xs text-[#1B4332]/70">{demoProfile.role}</span>
              </span>
              <span className="text-xs text-[#2D6A4F]">Use account</span>
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 border border-gray-300 rounded-lg px-4 py-2 text-dark font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
        >
          <Chrome size={18} />
          Google
        </button>

        <p className="text-center text-gray-600 mt-4">
          Don't have an account?{' '}
          <a href="/signup" className="font-semibold text-[#52B788] hover:underline">
            Sign Up
          </a>
        </p>
      </div>
    </div>
  );
};

export default LogIn;
