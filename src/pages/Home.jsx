import React from 'react';
import { useNavigate } from 'react-router-dom';
import { TreePine, Leaf, Award, MapPin } from 'lucide-react';

const Home = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary to-light">
      {/* Header */}
      <div className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <TreePine size={32} className="text-primary" />
            <h1 className="text-2xl font-bold text-dark">Trail Tracker</h1>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => navigate('/login')}
              className="px-4 py-2 text-primary font-medium hover:bg-gray-100 rounded-lg transition-colors"
            >
              Log In
            </button>
            <button
              onClick={() => navigate('/signup')}
              className="btn-primary px-4 py-2"
            >
              Sign Up
            </button>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <div className="max-w-6xl mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold text-dark mb-4">
            Make an Impact on Local Trails
          </h2>
          <p className="text-xl text-gray-700 mb-8">
            Report maintenance issues, log cleanups, and watch your virtual forest grow. 
            Join a community of trail advocates turning conservation into a game.
          </p>
          <button
            onClick={() => navigate('/signup')}
            className="btn-primary px-8 py-3 text-lg"
          >
            Get Started
          </button>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <div className="card">
            <div className="flex justify-center mb-4">
              <MapPin size={40} className="text-accent" />
            </div>
            <h3 className="text-xl font-bold text-dark mb-2 text-center">Report Issues</h3>
            <p className="text-gray-600 text-center">
              Spot a downed tree or mudslide? Pin it on the map and alert the community instantly.
            </p>
          </div>

          <div className="card">
            <div className="flex justify-center mb-4">
              <Leaf size={40} className="text-secondary" />
            </div>
            <h3 className="text-xl font-bold text-dark mb-2 text-center">Track Cleanups</h3>
            <p className="text-gray-600 text-center">
              Log bags of trash collected and upload photos of your trail maintenance work.
            </p>
          </div>

          <div className="card">
            <div className="flex justify-center mb-4">
              <Award size={40} className="text-primary" />
            </div>
            <h3 className="text-xl font-bold text-dark mb-2 text-center">Earn Rewards</h3>
            <p className="text-gray-600 text-center">
              Collect points, unlock badges, and grow your virtual forest with every contribution.
            </p>
          </div>
        </div>

        {/* Virtual Forest Section */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-16">
          <h3 className="text-2xl font-bold text-dark mb-4">Your Virtual Forest</h3>
          <p className="text-gray-600 mb-4">
            Every bag of trash collected or maintenance report verified plants a new tree in your personal forest. 
            Watch your impact grow as you help restore our local trails.
          </p>
          <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-8 text-center">
            <TreePine size={64} className="mx-auto text-primary mb-4" />
            <p className="text-gray-500">Start your journey to grow your forest</p>
          </div>
        </div>

        {/* Strava Integration */}
        <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-lg p-8 mb-16">
          <h3 className="text-2xl font-bold text-dark mb-4">Connect Strava</h3>
          <p className="text-gray-600 mb-4">
            Seamlessly integrate your Strava activities. Pin your recent runs and hikes,
            then attach trail cleanup reports directly to your recorded workouts.
          </p>
          <div className="flex flex-col items-center justify-center gap-3 text-gray-700 sm:flex-row">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-500 font-bold text-white">
              Ⓢ
            </div>
            <button
              type="button"
              onClick={() => navigate('/login')}
              className="rounded-xl bg-orange-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-orange-600"
            >
              Start syncing
            </button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-dark text-light py-8">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <p>&copy; 2024 East Bay Trail Tracker. Helping hikers make a difference.</p>
        </div>
      </footer>
    </div>
  );
};

export default Home;
