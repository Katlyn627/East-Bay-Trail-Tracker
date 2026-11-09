import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Sprout, Trees, Leaf, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const PLOT_SIZE = 12;

const PLANTING_STEPS = [
  { id: 'trash', icon: '♻️', label: 'Trash recycled into a glowing seed', duration: 700 },
  { id: 'seed', icon: '🌱', label: 'Seed is taking root in rich soil', duration: 700 },
  { id: 'planting', icon: '🌍', label: 'Shovel digs into the forest floor', duration: 800 },
  { id: 'sprout', icon: '💧', label: 'Sprout is watered and growing', duration: 800 },
  { id: 'sapling', icon: '🌿', label: 'Young sapling reaches upward', duration: 800 },
  { id: 'mature', icon: '🌲', label: 'Mature evergreen canopy forms', duration: 800 },
];

const getTreeStage = (tree) => {
  if (!tree?.plantedAt) return 'sprout';

  const plantedAt = new Date(tree.plantedAt).getTime();
  if (Number.isNaN(plantedAt)) return 'sprout';

  const ageDays = (Date.now() - plantedAt) / 86400000;

  if (ageDays >= 21) return 'mature';
  if (ageDays >= 7) return 'sapling';
  if (ageDays >= 1) return 'sprout';
  return 'seed';
};

const getStageLabel = (stage) => {
  switch (stage) {
    case 'seed':
      return 'Seed';
    case 'sprout':
      return 'Sprout';
    case 'sapling':
      return 'Sapling';
    case 'mature':
      return 'Mature Tree';
    default:
      return 'Sprout';
  }
};

function VirtualForest() {
  const { userProfile, updateUserProfile, loading } = useAuth();
  const [selectedTree, setSelectedTree] = useState(null);
  const [plantingStage, setPlantingStage] = useState('idle');
  const [plantProgress, setPlantProgress] = useState(0);
  const plantingTimersRef = useRef([]);

  const treeCount = Number(userProfile?.treesPlanted) || 0;
  const saplingsAvailable = Number(userProfile?.saplingsAvailable) || 0;
  const treeHistory = Array.isArray(userProfile?.treeHistory) ? userProfile.treeHistory.filter(Boolean) : [];

  useEffect(() => {
    return () => {
      plantingTimersRef.current.forEach((timer) => window.clearTimeout(timer));
    };
  }, []);

  const plotCells = useMemo(() => {
    const fallbackTrees = Array.from({ length: Math.max(treeCount, 0) }, (_, index) => ({
      id: `fallback-${index}`,
      title: 'Trail recovery sapling',
      plantedAt: new Date(Date.now() - index * 86400000).toISOString(),
      trashBagsCollected: 2 + index,
      milesLogged: 1.2 + index * 0.8,
      pointsBalance: 50 + index * 25,
    }));

    return (treeHistory.length ? treeHistory : fallbackTrees).slice(0, PLOT_SIZE);
  }, [treeHistory, treeCount]);

  const handleGrowTree = async () => {
    if (!updateUserProfile || typeof updateUserProfile !== 'function') return;

    const currentSaplings = Math.max(0, Number(userProfile?.saplingsAvailable) || 0);
    if (currentSaplings <= 0) return;

    const currentTrees = Math.max(0, Number(userProfile?.treesPlanted) || 0);
    const currentHistory = Array.isArray(userProfile?.treeHistory) ? userProfile.treeHistory.filter(Boolean) : [];

    plantingTimersRef.current.forEach((timer) => window.clearTimeout(timer));
    plantingTimersRef.current = [];

    setPlantingStage('trash');
    setPlantProgress(12);

    const newTree = {
      id: `new-tree-${Date.now()}`,
      title: 'Trail recovery sapling',
      plantedAt: new Date().toISOString(),
      trashBagsCollected: 0,
      milesLogged: 0,
      pointsBalance: 25,
      cleanupReportId: 'manual-plant',
      stage: 'seed',
    };

    PLANTING_STEPS.forEach((step, index) => {
      const timer = window.setTimeout(() => {
        setPlantingStage(step.id);
        setPlantProgress(((index + 1) / PLANTING_STEPS.length) * 100);
      }, index * 650 + 120);
      plantingTimersRef.current.push(timer);
    });

    const finishTimer = window.setTimeout(async () => {
      try {
        await updateUserProfile({
          saplingsAvailable: currentSaplings - 1,
          treesPlanted: currentTrees + 1,
          treeHistory: [...currentHistory, newTree],
        });
      } catch (error) {
        console.error('Failed to plant tree:', error);
      } finally {
        setPlantingStage('idle');
        setPlantProgress(0);
      }
    }, PLANTING_STEPS.length * 650 + 300);

    plantingTimersRef.current.push(finishTimer);
  };

  if (loading) {
    return (
      <div className="card mb-8 rounded-2xl border border-emerald-100 bg-gradient-to-br from-emerald-50 to-white p-5 text-sm text-slate-600">
        Loading your forest...
      </div>
    );
  }

  if (!userProfile) {
    return (
      <div className="card mb-8 rounded-2xl border border-dashed border-emerald-200 bg-emerald-50/60 p-5 text-sm text-emerald-700">
        Sign in to begin growing your virtual forest.
      </div>
    );
  }

  const currentPlantingStep = PLANTING_STEPS.find((step) => step.id === plantingStage) || PLANTING_STEPS[0];

  return (
    <div className="card mb-8 overflow-hidden rounded-2xl border border-emerald-100 bg-gradient-to-br from-emerald-50 to-white p-4 sm:p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600 shadow-sm">
            <Trees size={22} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900 sm:text-xl">Virtual Forest</h3>
            <p className="text-xs text-slate-600 sm:text-sm">Grow your trail legacy from seed to canopy.</p>
          </div>
        </div>

        <div className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700 sm:text-sm">
          {saplingsAvailable} saplings
        </div>
      </div>

      <div className="mb-4 flex items-center gap-2 rounded-xl bg-white/70 px-3 py-2 text-xs text-emerald-700 shadow-sm ring-1 ring-emerald-100">
        <span className="font-semibold">Growth:</span>
        <span>Seed → Sprout → Sapling → Mature tree</span>
      </div>

      {plantingStage !== 'idle' && (
        <div className="trash-to-tree-sequence mb-4">
          <div className="sequence-scene">
            <div className={`sequence-item sequence-item-${plantingStage}`}>
              {currentPlantingStep.icon}
            </div>
            <div className="sequence-soil" />
          </div>

          <div className="mt-3">
            <div className="mb-2 flex items-center justify-between text-[10px] font-semibold uppercase tracking-[0.16em] text-emerald-700">
              <span>Planting sequence</span>
              <span>{Math.round(plantProgress)}%</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-emerald-100">
              <div
                className="h-full rounded-full bg-gradient-to-r from-amber-400 via-emerald-500 to-emerald-700 transition-all duration-300"
                style={{ width: `${plantProgress}%` }}
              />
            </div>
            <p className="mt-3 text-center text-sm font-bold text-slate-900">{currentPlantingStep.label}</p>
          </div>
        </div>
      )}

      {plotCells.length > 0 ? (
        <div className="mb-5 grid grid-cols-4 gap-3 sm:grid-cols-6">
          {plotCells.map((tree, index) => {
            const stage = getTreeStage(tree);
            const stageClasses = {
              seed: 'border-amber-200 bg-amber-50 text-amber-700 animate-pulse',
              sprout: 'border-emerald-200 bg-emerald-50 text-emerald-600 forest-sprout',
              sapling: 'border-lime-200 bg-lime-50 text-lime-700 forest-sapling',
              mature: 'border-emerald-300 bg-emerald-100 text-emerald-700 forest-mature',
            };
            const Icon = stage === 'seed' ? Sprout : stage === 'sprout' ? Sprout : stage === 'sapling' ? Leaf : Trees;

            return (
              <button
                type="button"
                key={tree.id || index}
                onClick={() => setSelectedTree(tree)}
                className={`group flex h-16 items-center justify-center rounded-2xl border shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-md ${stageClasses[stage]}`}
                title={`Open ${tree.title || 'Tree'} history`}
                aria-label={`View tree history ${index + 1}`}
              >
                <Icon size={20} className="transition-transform duration-300 group-hover:scale-110" />
              </button>
            );
          })}
        </div>
      ) : (
        <div className="mb-5 rounded-2xl border border-dashed border-slate-300 bg-white p-4 text-sm text-slate-500">
          No trees planted yet. Log a cleanup to start your forest.
        </div>
      )}

      <div className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 p-3 sm:p-4">
        <div>
          <p className="text-xs text-slate-500 sm:text-sm">Total planted trees</p>
          <p className="text-2xl font-bold text-slate-900">{treeCount}</p>
        </div>

        <button
          type="button"
          onClick={handleGrowTree}
          disabled={saplingsAvailable <= 0 || plantingStage !== 'idle'}
          className="h-11 rounded-xl bg-emerald-600 px-4 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {plantingStage !== 'idle' ? 'Planting...' : 'Grow tree'}
        </button>
      </div>

      {selectedTree && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/60 px-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-emerald-600">Tree history</p>
                <h3 className="text-xl font-bold text-slate-900">{selectedTree.title || 'Trail tree'}</h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedTree(null)}
                className="flex h-10 w-10 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
                aria-label="Close tree history"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3 text-sm text-slate-600">
              <div className="rounded-xl bg-emerald-50 p-3">
                <p className="text-[10px] uppercase tracking-[0.14em] text-emerald-700">Current stage</p>
                <p className="mt-1 font-semibold text-emerald-900">{getStageLabel(getTreeStage(selectedTree))}</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-slate-50 p-3">
                  <p className="text-[10px] uppercase tracking-[0.14em] text-slate-500">Planted</p>
                  <p className="mt-1 font-semibold text-slate-900">
                    {selectedTree.plantedAt ? new Date(selectedTree.plantedAt).toLocaleDateString() : '—'}
                  </p>
                </div>
                <div className="rounded-xl bg-slate-50 p-3">
                  <p className="text-[10px] uppercase tracking-[0.14em] text-slate-500">Cleanup</p>
                  <p className="mt-1 font-semibold text-slate-900">
                    {selectedTree.cleanupReportId || selectedTree.issueType || 'Trail work'}
                  </p>
                </div>
              </div>

              <div className="rounded-xl bg-slate-50 p-3">
                <p className="text-[10px] uppercase tracking-[0.14em] text-slate-500">Trash bags collected</p>
                <p className="mt-1 text-lg font-bold text-slate-900">{selectedTree.trashBagsCollected ?? 0}</p>
              </div>

              <div className="rounded-xl bg-slate-50 p-3">
                <p className="text-[10px] uppercase tracking-[0.14em] text-slate-500">Miles logged</p>
                <p className="mt-1 text-lg font-bold text-slate-900">{selectedTree.milesLogged ?? 0} mi</p>
              </div>

              <div className="rounded-xl bg-slate-50 p-3">
                <p className="text-[10px] uppercase tracking-[0.14em] text-slate-500">Points earned</p>
                <p className="mt-1 text-lg font-bold text-slate-900">{selectedTree.pointsBalance ?? 0}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default VirtualForest;
