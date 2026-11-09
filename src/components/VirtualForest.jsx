import React, { useMemo } from 'react';
import { Sprout, Trees, Leaf } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const PLOT_SIZE = 12;

function VirtualForest() {
  const { userProfile, updateUserProfile } = useAuth();

  const treeCount = userProfile?.treesPlanted || 0;
  const saplingsAvailable = userProfile?.saplingsAvailable || 0;

  const plotCells = useMemo(
    () => Array.from({ length: PLOT_SIZE }, (_, index) => index < treeCount),
    [treeCount]
  );

  const handleGrowTree = async () => {
    if (saplingsAvailable <= 0) return;

    await updateUserProfile({
      saplingsAvailable: saplingsAvailable - 1,
      treesPlanted: treeCount + 1,
    });
  };

  return (
    <div className="card mb-8">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-emerald-100 p-3 text-emerald-600">
            <Trees size={22} />
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-900">Virtual Forest</h3>
            <p className="text-sm text-slate-600">Grow your trail legacy one sapling at a time.</p>
          </div>
        </div>

        <div className="rounded-full bg-emerald-100 px-3 py-1 text-sm font-semibold text-emerald-700">
          {saplingsAvailable} saplings
        </div>
      </div>

      <div className="mb-5 grid grid-cols-4 gap-3 sm:grid-cols-6">
        {plotCells.map((hasTree, index) => (
          <div
            key={index}
            className={`flex h-14 items-center justify-center rounded-xl border ${
              hasTree
                ? 'border-emerald-200 bg-emerald-100 text-emerald-700'
                : 'border-slate-200 bg-slate-50 text-slate-300'
            }`}
          >
            {hasTree ? <Leaf size={18} /> : <Sprout size={18} />}
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 p-4">
        <div>
          <p className="text-sm text-slate-500">Total planted trees</p>
          <p className="text-2xl font-bold text-slate-900">{treeCount}</p>
        </div>

        <button
          type="button"
          onClick={handleGrowTree}
          disabled={saplingsAvailable <= 0}
          className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Grow tree
        </button>
      </div>
    </div>
  );
}

export default VirtualForest;
