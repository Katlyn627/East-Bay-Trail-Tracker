import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Mail, Lock, User, Loader } from 'lucide-react';

const SignUp = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signUp } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      setLoading(false);
      return;
    }

    try {
      await signUp(email, password, displayName);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Failed to create account');
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
        <h1 className="text-3xl font-heading font-black text-forest-deep mb-2 text-center">Join the Trail</h1>
        <p className="text-forest-moss font-medium text-center mb-8">Create your account and start making an impact</p>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-2xl mb-6 text-sm font-medium animate-shake">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-forest-deep mb-2 uppercase tracking-widest">Full Name</label>
            <div className="flex items-center bg-white border-2 border-sage-mist rounded-2xl px-4 py-3 focus-within:border-forest-evergreen transition-colors">
              <User size={18} className="text-forest-moss mr-3" />
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="John Doe"
                className="flex-1 focus:outline-none text-forest-deep placeholder:text-forest-moss/50 bg-transparent"
                required
              />
            </div>
          </div>

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

          <div>
            <label className="block text-xs font-bold text-forest-deep mb-2 uppercase tracking-widest">Confirm Password</label>
            <div className="flex items-center bg-white border-2 border-sage-mist rounded-2xl px-4 py-3 focus-within:border-forest-evergreen transition-colors">
              <Lock size={18} className="text-forest-moss mr-3" />
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="flex-1 focus:outline-none text-forest-deep placeholder:text-forest-moss/50 bg-transparent"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full btn-nature py-4 flex items-center justify-center gap-2 text-lg shadow-lg mt-4"
          >
            {loading ? (
              <>
                <Loader size={20} className="animate-spin" />
                Creating Account...
              </>
            ) : (
              'Create Account'
            )}
          </button>
        </form>

        <p className="text-center text-forest-moss font-medium mt-8">
          Already have an account?{' '}
          <a href="/login" className="font-bold text-poppy hover:text-poppy-light underline decoration-2 underline-offset-4">
            Log In
          </a>
        </p>
      </div>
    </div>
  );
};

export default SignUp;
