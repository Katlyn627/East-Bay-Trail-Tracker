import React, { useState } from 'react';
import { Trees, Sprout, Shovel, Sparkles, X, Droplet } from 'lucide-react';

export default function VirtualForest({ userStats, onPlantTree }) {
  const [plantingState, setPlantingState] = useState('idle'); // 'idle', 'recycling', 'digging', 'sprouting', 'grown'
  const [selectedTree, setSelectedTree] = useState(null);

  const startForestAnimation = () => {
    if ((userStats?.saplings || 0) <= 0) {
      alert('You need saplings! Log a cleanup to earn seeds.');
      return;
    }

    // Step 1: Trash to Seed
    setPlantingState('recycling');

    setTimeout(() => {
      // Step 2: Digging & Planting in Ground
      setPlantingState('digging');
    }, 1500);

    setTimeout(() => {
      // Step 3: Sprouting & Watering
      setPlantingState('sprouting');
    }, 3000);

    setTimeout(() => {
      // Step 4: Fully Grown Tree
      setPlantingState('grown');
      onPlantTree(); // Saves to Firestore
      setTimeout(() => setPlantingState('idle'), 2000);
    }, 4500);
  };

  return (
    <div className="bg-[#1B4332] text-[#F4F6F0] p-6 rounded-2xl shadow-xl border-2 border-[#2D5A27] relative overflow-hidden w-full max-w-lg mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Trees className="text-[#FFB703]" /> East Bay Canopy
          </h2>
          <p className="text-xs text-[#D8F3DC]">Live Forest Ecosystem</p>
        </div>
        <div className="bg-[#2D5A27] px-3 py-1 rounded-full text-xs font-semibold border border-[#52B788]">
          🌱 {userStats?.saplings || 0} Saplings
        </div>
      </div>

      {/* Forest Plot Grid */}
      <div className="bg-[#2D5A27]/50 p-4 rounded-xl border border-[#52B788]/40 min-h-[220px] flex items-center justify-center relative">
        {plantingState !== 'idle' ? (
          /* FOREST & FLORA STYLE ANIMATION OVERLAY */
          <div className="absolute inset-0 bg-[#1B4332]/95 backdrop-blur-md flex flex-col items-center justify-center p-4 z-20 text-center animate-fade-in">
            <div className="text-5xl mb-4 transition-all duration-700 transform scale-110">
              {plantingState === 'recycling' && <span className="animate-spin inline-block">♻️ ➡️ 🌱</span>}
              {plantingState === 'digging' && <span className="animate-bounce inline-block">🌍 ⛏️</span>}
              {plantingState === 'sprouting' && <span className="animate-pulse inline-block">💧 🌱 ✨</span>}
              {plantingState === 'grown' && <span className="animate-bounce inline-block">🌲 🎉 🌲</span>}
            </div>
            <h3 className="text-lg font-bold text-[#FFB703] mb-1">
              {plantingState === 'recycling' && 'Converting Trash to Seed...'}
              {plantingState === 'digging' && 'Planting Seed in Forest Soil...'}
              {plantingState === 'sprouting' && 'Nurturing & Watering Sapling...'}
              {plantingState === 'grown' && 'Tree Successfully Grown!'}
            </h3>
            <p className="text-xs text-[#D8F3DC]">
              {plantingState === 'grown' ? 'Added to your permanent canopy.' : 'Watch your forest come to life...'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-4 gap-3 w-full">
            {userStats?.plantedTrees?.map((tree, idx) => (
              <div
                key={tree.id || idx}
                onClick={() => setSelectedTree(tree)}
                className="bg-[#1B4332] hover:bg-[#2D5A27] p-3 rounded-lg flex flex-col items-center justify-center cursor-pointer transition transform hover:scale-105 border border-[#52B788]/50 shadow-md group"
              >
                <Trees className="w-7 h-7 text-[#52B788] group-hover:text-[#FFB703] transition-colors" />
                <span className="text-[10px] text-[#D8F3DC] mt-1">Tree #{idx + 1}</span>
              </div>
            ))}
            {(!userStats?.plantedTrees || userStats.plantedTrees.length === 0) && (
              <div className="col-span-4 text-center py-6 text-xs text-[#D8F3DC]/80">
                Your forest is empty. Plant your first tree below!
              </div>
            )}
          </div>
        )}
      </div>

      {/* Grow Action Button */}
      <div className="mt-6 flex justify-center">
        <button
          onClick={startForestAnimation}
          disabled={plantingState !== 'idle' || (userStats?.saplings || 0) <= 0}
          className="bg-[#FFB703] hover:bg-[#e0a102] text-[#1B4332] font-bold px-6 py-3 rounded-xl shadow-lg flex items-center gap-2 transition transform active:scale-95 disabled:opacity-50"
        >
          <Shovel className="w-5 h-5" /> Plant Tree in Ground
        </button>
      </div>

      {/* Tree History Modal */}
      {selectedTree && (
        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-[#1B4332] border border-[#52B788] p-5 rounded-2xl max-w-xs w-full shadow-2xl relative">
            <button
              onClick={() => setSelectedTree(null)}
              className="absolute top-3 right-3 text-[#D8F3DC] hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-base font-bold text-[#FFB703] mb-3 flex items-center gap-2">
              <Sparkles className="w-4 h-4" /> Tree History
            </h3>
            <div className="space-y-2 text-xs text-[#D8F3DC]">
              <p><strong>Planted:</strong> {new Date(selectedTree.timestamp || Date.now()).toLocaleDateString()}</p>
              <p><strong>Cleanup ID:</strong> {selectedTree.cleanupId || 'Community Drive'}</p>
              <p><strong>Stage:</strong> Mature Evergreen 🌲</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}