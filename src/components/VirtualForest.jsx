import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Trees, Shovel, Sparkles, X, Trash2 } from 'lucide-react';

const getTreeStage = (tree) => {
  if (!tree?.timestamp) return 'Seed';

  const plantedAt = new Date(tree.timestamp).getTime();
  if (Number.isNaN(plantedAt)) return 'Seed';

  const ageHours = (Date.now() - plantedAt) / (1000 * 60 * 60);

  if (ageHours < 24) return 'Seed';
  if (ageHours < 168) return 'Sapling';
  return 'Mature Canopy';
};

const renderTreeSprite = (tree, index, stageOnly = false) => {
  const stage = tree?.stage || getTreeStage(tree);
  const isSeed = stage === 'Seed';
  const isSapling = stage === 'Sapling';
  const isMature = stage === 'Mature Canopy';

  const size = isSeed ? 54 : isSapling ? 82 : 122;
  const trunkHeight = isSeed ? 16 : isSapling ? 24 : 36;
  const canopySize = isSeed ? 26 : isSapling ? 42 : 62;
  const canopyColor = isSeed ? '#a6d96a' : isSapling ? '#64b96f' : '#2f7d4a';
  const glow = isMature ? 'rgba(196, 255, 162, 0.6)' : 'rgba(166, 217, 106, 0.35)';

  return (
    <div
      key={tree?.id || `tree-sprite-${index}`}
      className="tree-sprite relative"
      style={{
        width: `${size + 18}px`,
        height: `${size + 36}px`,
        opacity: stageOnly ? 0.92 : 1,
        filter: isMature ? 'drop-shadow(0 14px 20px rgba(8, 50, 30, 0.55))' : 'drop-shadow(0 10px 16px rgba(12, 40, 20, 0.35))',
      }}
    >
      <div
        className="absolute left-1/2 bottom-0 -translate-x-1/2 rounded-t-[10px] bg-[#724b2d]"
        style={{
          width: `${Math.max(8, size * 0.14)}px`,
          height: `${trunkHeight}px`,
          borderRadius: '12px 12px 8px 8px',
          boxShadow: 'inset 0 0 10px rgba(0,0,0,0.12)',
        }}
      />

      <div
        className="absolute left-1/2 -translate-x-1/2 rounded-full"
        style={{
          background: canopyColor,
          left: '50%',
          bottom: `${trunkHeight - 2}px`,
          width: `${canopySize}px`,
          height: `${canopySize}px`,
          boxShadow: `0 0 16px ${glow}`,
        }}
      />

      {isSapling && (
        <div
          className="absolute rounded-full"
          style={{
            background: '#7cc77a',
            left: '50%',
            bottom: `${trunkHeight + 14}px`,
            transform: 'translateX(-50%)',
            width: `${canopySize * 0.72}px`,
            height: `${canopySize * 0.72}px`,
            boxShadow: '0 0 16px rgba(255,255,255,0.25)',
          }}
        />
      )}

      {isMature && (
        <>
          <div
            className="absolute rounded-full"
            style={{
              background: '#3d9d62',
              left: '18%',
              bottom: `${trunkHeight + 10}px`,
              width: `${canopySize * 0.9}px`,
              height: `${canopySize * 0.9}px`,
            }}
          />
          <div
            className="absolute rounded-full"
            style={{
              background: '#2e8a52',
              left: '52%',
              bottom: `${trunkHeight + 18}px`,
              width: `${canopySize * 0.92}px`,
              height: `${canopySize * 0.92}px`,
            }}
          />
          <div
            className="absolute rounded-full"
            style={{
              background: '#49a86a',
              left: '38%',
              bottom: `${trunkHeight + 26}px`,
              width: `${canopySize * 0.8}px`,
              height: `${canopySize * 0.8}px`,
            }}
          />
        </>
      )}
    </div>
  );
};

export default function VirtualForest({ userStats, onPlantTree }) {
  const [animationStep, setAnimationStep] = useState('idle');
  const [growthProgress, setGrowthProgress] = useState(0);
  const [selectedTree, setSelectedTree] = useState(null);
  const [showMascot, setShowMascot] = useState(true);
  const timeoutRefs = useRef([]);

  const saplingCount = Number(userStats?.saplings ?? userStats?.saplingsAvailable ?? userStats?.seeds ?? 0) || 0;
  const plantedTrees = Array.isArray(userStats?.plantedTrees)
    ? userStats.plantedTrees
    : Array.isArray(userStats?.treeHistory)
      ? userStats.treeHistory
      : [];

  const forestTrees = useMemo(
    () =>
      plantedTrees.map((tree, index) => ({
        ...tree,
        index,
        stage: getTreeStage(tree),
      })),
    [plantedTrees]
  );

  const clearTimers = () => {
    timeoutRefs.current.forEach((timerId) => clearTimeout(timerId));
    timeoutRefs.current = [];
  };

  useEffect(() => {
    const greetingTimer = setTimeout(() => setShowMascot(false), 5000);
    return () => {
      clearTimeout(greetingTimer);
      clearTimers();
    };
  }, []);

  useEffect(() => {
    if (animationStep === 'watering') {
      const intervalId = setInterval(() => {
        setGrowthProgress((current) => Math.min(current + 14, 100));
      }, 180);
      return () => clearInterval(intervalId);
    }
    if (animationStep === 'idle') {
      setGrowthProgress(0);
    }
  }, [animationStep]);

  const handlePlantSequence = () => {
    if (saplingCount <= 0) {
      alert('You need saplings! Log a cleanup to earn seeds.');
      return;
    }

    clearTimers();
    setSelectedTree(null);
    setGrowthProgress(0);
    setAnimationStep('bear-enter');

    timeoutRefs.current = [
      setTimeout(() => setAnimationStep('trash-to-seed'), 900),
      setTimeout(() => setAnimationStep('digging'), 2200),
      setTimeout(() => setAnimationStep('planting'), 3600),
      setTimeout(() => setAnimationStep('watering'), 5000),
      setTimeout(() => {
        setGrowthProgress(100);
        setAnimationStep('complete');
      }, 7100),
      setTimeout(() => {
        setAnimationStep('idle');
        onPlantTree?.();
      }, 9300),
    ];
  };

  const treeStageLabels = {
    Seed: { emoji: '🌱', label: 'Seed' },
    Sapling: { emoji: '🌿', label: 'Sapling' },
    'Mature Canopy': { emoji: '🌲', label: 'Mature Canopy' },
  };

  const renderForestLandscape = () => (
    <div className="relative h-[420px] min-h-[420px] w-full overflow-hidden rounded-[28px] border border-[#2a4c36] bg-[radial-gradient(circle_at_top,_rgba(184,232,143,0.2),_transparent_38%),linear-gradient(180deg,#1a4f3a_0%,#173f34_18%,#1b4d32_50%,#112d20_100%)] shadow-[inset_0_0_60px_rgba(13,31,17,0.42)]">
      <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#1f3f2a] via-[#32573c] to-[#3b6547]" />
      <div className="absolute inset-x-0 bottom-14 h-10 rounded-full bg-[#4d7d57]/80 blur-md" />
      <div className="absolute inset-x-0 bottom-8 h-2 bg-[#4a6c47]/70" />

      {Array.from({ length: 9 }).map((_, idx) => (
        <div
          key={`hill-${idx}`}
          className="absolute rounded-full bg-[#2a5a43]/60"
          style={{
            width: `${140 + idx * 48}px`,
            height: `${55 + idx * 18}px`,
            left: `${-16 + idx * 12}%`,
            bottom: `${18 + (idx % 3) * 14}px`,
            filter: 'blur(8px)',
            opacity: 0.45,
          }}
        />
      ))}

      {forestTrees.map((tree, idx) => {
        const xPercent = 8 + ((idx * 86) / Math.max(1, forestTrees.length || 1)) + (idx % 2) * 4;
        const sizeScale = tree.stage === 'Seed' ? 0.85 : tree.stage === 'Sapling' ? 1.1 : 1.4;

        return (
          <button
            key={tree.id || `forest-tree-${idx}`}
            type="button"
            onClick={() => setSelectedTree(tree)}
            className="absolute bottom-[42px] flex -translate-x-1/2 flex-col items-center justify-end transition duration-200 hover:scale-[1.03]"
            style={{
              left: `${Math.min(92, xPercent)}%`,
              transform: `translateX(-50%) scale(${sizeScale})`,
            }}
          >
            {renderTreeSprite(tree, idx, true)}
            <span className="mt-1 rounded-full bg-[#112a1c]/70 px-2 py-1 text-[9px] font-semibold uppercase tracking-[0.12em] text-[#edf9e7]">
              {tree.stage || 'Seed'}
            </span>
          </button>
        );
      })}

      {forestTrees.length === 0 && (
        <div className="absolute inset-x-0 bottom-20 text-center text-xs font-medium tracking-[0.16em] text-[#d9f4dd]/70 uppercase">
          The forest floor is ready
        </div>
      )}
    </div>
  );

  const renderScene = () => {
    const activeProgress = animationStep === 'complete' ? 100 : animationStep === 'watering' ? growthProgress : 0;
    const stageText = {
      'bear-enter': 'Park ranger bear is on the trail...',
      'trash-to-seed': 'Turning collected trash into a glowing seed...',
      digging: 'Digging a cozy hole in the rich soil...',
      planting: 'Planting the seed in the forest floor...',
      watering: 'Watering and nurturing the new growth...',
      complete: 'A new tree joins the canopy!',
    };

    return (
      <div className="relative h-[420px] min-h-[420px] w-full overflow-hidden rounded-[28px] border border-[#3a2d1c] bg-[radial-gradient(circle_at_top,_rgba(217,255,184,0.12),transparent_28%),linear-gradient(180deg,#274b36_0%,#1c3a2c_38%,#142d22_100%)] shadow-inner">
        <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-[#2b4a35] via-[#3f5d3f] to-[#4d7757]" />
        <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-[#5c4033] to-[#4a311f]" />
        <div className="absolute inset-x-4 bottom-12 h-4 rounded-full bg-[#4e7d59] shadow-[0_0_30px_rgba(93,151,83,0.5)]" />

        <div
          className={`absolute bottom-8 text-[5.5rem] ${animationStep === 'bear-enter' ? 'bear-walk-in' : animationStep === 'complete' ? 'bear-walk-away' : 'bear-slide'}`}
          style={{
            left: animationStep === 'bear-enter' ? '8%' : animationStep === 'complete' ? '82%' : '12%',
            transformOrigin: 'center bottom',
          }}
        >
          🐻
        </div>

        {animationStep === 'bear-enter' && (
          <div className="absolute bottom-12 left-1/2 flex -translate-x-1/2 items-end gap-3">
            <div className="rounded-2xl border border-[#f3e9cf] bg-[#f6f7ef] px-4 py-3 text-sm font-semibold text-[#1a3a2a] shadow-xl">
              Welcome back! <span className="inline-block animate-wave">👋</span>
              <div className="mt-1 text-xs text-[#4d5e56]">"Welcome back! What trails have you cleaned up recently?"</div>
            </div>
            <div className="mb-3 text-5xl">👜</div>
          </div>
        )}

        {(animationStep === 'trash-to-seed' || animationStep === 'digging' || animationStep === 'planting' || animationStep === 'watering' || animationStep === 'complete') && (
          <div className="absolute inset-0">
            <div className="absolute left-1/2 top-8 h-20 w-20 -translate-x-1/2 rounded-full bg-[#f7e7a3]/35 blur-3xl" />
            <div className="absolute bottom-10 left-[18%] text-5xl">🐻</div>
            <div className="absolute bottom-16 left-[24%] text-4xl animate-bag-bounce">👜</div>
            <div className="absolute left-1/2 top-10 flex -translate-x-1/2 items-center gap-4 text-6xl">
              <Trash2 className="h-10 w-10 text-[#FFB703] drop-shadow-[0_0_16px_rgba(255,183,3,0.8)] animate-pulse" />
              <span className="text-4xl">➡️</span>
              <span className="animate-pulse drop-shadow-[0_0_18px_rgba(255,255,255,0.9)]">✨🌱</span>
            </div>
          </div>
        )}

        {animationStep === 'digging' && (
          <div className="absolute inset-0">
            <div className="absolute left-1/2 bottom-12 flex -translate-x-1/2 items-center justify-center">
              <div className="absolute h-16 w-20 rounded-full bg-[#5c4033] shadow-[0_0_24px_rgba(92,64,51,0.8)]" />
              <div className="absolute bottom-4 h-7 w-7 rounded-full bg-[#3b2c23]" />
              <Shovel className="h-12 w-12 -translate-y-1 text-[#eadbca]" />
            </div>
          </div>
        )}

        {animationStep === 'planting' && (
          <div className="absolute inset-0">
            <div className="absolute left-1/2 bottom-12 h-12 w-12 -translate-x-1/2 rounded-full bg-[#5c4033] shadow-[0_0_26px_rgba(92,64,51,0.8)]" />
            <div className="absolute left-1/2 top-16 h-16 w-16 -translate-x-1/2 rounded-full bg-[#a5d95d] shadow-[0_0_20px_rgba(165,217,93,0.9)] seed-drop" />
          </div>
        )}

        {animationStep === 'watering' && (
          <div className="absolute inset-0">
            <div className="absolute right-[20%] top-11 rotate-[-18deg] text-5xl text-[#7dd3fc] animate-pulse">💧</div>
            <div className="absolute left-[22%] top-16 rotate-[18deg] text-5xl text-[#7dd3fc] animate-pulse">💧</div>
            <div className="absolute left-1/2 bottom-14 h-24 w-3 -translate-x-1/2 rounded-full bg-[#7b4d2b] transition-all duration-300" style={{ height: `${Math.max(30, activeProgress * 0.58)}px` }} />
            <div className="absolute left-1/2 bottom-20 flex -translate-x-1/2 items-center justify-center transition-all duration-300" style={{ transform: `translateX(-50%) scale(${0.8 + activeProgress / 120})` }}>
              <span className="text-5xl">🌿</span>
              <span className="text-6xl">🌲</span>
            </div>
            <div className="absolute left-1/2 bottom-12 flex -translate-x-1/2 gap-5 text-4xl">
              <Sparkles className="h-5 w-5 animate-ping text-[#FDE68A]" />
              <Sparkles className="h-5 w-5 animate-ping text-[#FDE68A]" />
            </div>
          </div>
        )}

        {animationStep === 'complete' && (
          <div className="absolute inset-0">
            <div className="absolute left-1/2 bottom-14 h-28 w-4 -translate-x-1/2 rounded-full bg-[#7b4d2b]" />
            <div className="absolute left-1/2 bottom-24 flex -translate-x-1/2 items-center justify-center gap-2">
              <span className="text-6xl">🌲</span>
              <span className="text-5xl">✨</span>
              <span className="text-6xl">🌲</span>
            </div>
            <div className="absolute left-1/2 bottom-12 flex -translate-x-1/2 gap-5 text-4xl">
              <Sparkles className="h-5 w-5 animate-ping text-[#FDE68A]" />
              <Sparkles className="h-6 w-6 animate-ping text-[#FDE68A]" />
              <Sparkles className="h-5 w-5 animate-ping text-[#FDE68A]" />
            </div>
            <div className="absolute bottom-8 right-12 text-6xl bear-walk-away">🐻</div>
          </div>
        )}

        <div className="absolute inset-x-0 bottom-0 z-30 h-14 bg-gradient-to-t from-[#1b3124] to-transparent" />
      </div>
    );
  };

  return (
    <>
      <style>{`
        @keyframes slideInBear {
          0% { transform: translateX(-120%) scale(0.9); opacity: 0; }
          55% { transform: translateX(12%) scale(1.02); opacity: 1; }
          100% { transform: translateX(0) scale(1); opacity: 1; }
        }
        @keyframes wave {
          0%,100% { transform: rotate(0deg); }
          25% { transform: rotate(18deg); }
          50% { transform: rotate(-12deg); }
          75% { transform: rotate(16deg); }
        }
        @keyframes bagBounce {
          0%,100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-10px) rotate(10deg); }
        }
        @keyframes bearWalkAway {
          0% { transform: translateX(0); opacity: 1; }
          100% { transform: translateX(115px); opacity: 0; }
        }
        @keyframes bearWalkIn {
          0% { transform: translateX(-180px) scale(0.85); opacity: 0; }
          30% { opacity: 1; }
          100% { transform: translateX(150px) scale(1); opacity: 1; }
        }
        @keyframes seedDrop {
          0% { transform: translate(-50%, -50px) scale(0.8); opacity: 0.2; }
          30% { transform: translate(-50%, 30px) scale(1); opacity: 1; }
          70% { transform: translate(-50%, 90px) scale(1.15); opacity: 1; }
          100% { transform: translate(-50%, 116px) scale(0.8); opacity: 0.9; }
        }
        .bear-slide { animation: slideInBear 0.8s ease-out forwards; }
        .bear-walk-in { animation: bearWalkIn 2.1s ease-in-out forwards; }
        .animate-wave { display: inline-block; animation: wave 1.1s ease-in-out infinite; }
        .animate-bag-bounce { animation: bagBounce 1.2s ease-in-out infinite; }
        .bear-walk-away { animation: bearWalkAway 1.2s ease-in forwards; }
        .seed-drop { animation: seedDrop 1.3s ease-in forwards; }
      `}</style>

      <div className="mx-auto min-h-[500px] w-full max-w-6xl rounded-[32px] border border-[#38624e] bg-[#12372d] p-4 shadow-[0_24px_60px_rgba(6,18,12,0.38)] sm:p-6">
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="mb-1 flex items-center gap-2 text-xl font-bold text-[#f6f9f2] sm:text-2xl">
              <Trees className="h-6 w-6 text-[#ffb703]" /> East Bay Canopy
            </div>
            <p className="text-xs uppercase tracking-[0.2em] text-[#d8f3dc]">Trail cleanup forest</p>
          </div>

          <div className="flex items-center gap-3">
            <div className="rounded-full border border-[#5ace8d] bg-[#2d5b42] px-3 py-1 text-xs font-semibold text-[#edf8ef]">
              🌱 {saplingCount} saplings
            </div>
          </div>
        </div>

        {showMascot && (
          <div className="mb-4 flex items-end gap-3">
            <div className="text-6xl bear-slide">🐻</div>
            <div className="max-w-[320px] rounded-[22px] border border-[#e9dec3] bg-[#f6f5ef] px-4 py-3 text-sm font-medium text-[#1a3b2d] shadow-xl">
              <div className="inline-flex items-center gap-2">Hello! <span className="animate-wave">👋</span></div>
              <div className="mt-1 text-xs text-[#485c4f]">"Welcome back! What trails have you cleaned up recently?"</div>
            </div>
          </div>
        )}

        <div className="relative min-h-[420px] overflow-hidden rounded-[28px] border border-[#40755e] bg-[#183d31]/70 p-3 sm:p-5">
          {animationStep !== 'idle' ? (
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-[#102d24]/90 p-4 backdrop-blur-sm">
              <div className="mb-4 w-full max-w-[820px] animate-[fadeIn_0.45s_ease-in-out]">{renderScene()}</div>
              <div className="mb-3 h-2.5 w-48 overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[#A3D65C] via-[#7AD7A3] to-[#FFB703] transition-all duration-300"
                  style={{ width: `${Math.min(100, animationStep === 'complete' ? 100 : animationStep === 'watering' ? growthProgress : animationStep === 'planting' ? 70 : 20)}%` }}
                />
              </div>
              <h3 className="mb-1 text-lg font-bold text-[#FFB703]">
                {animationStep === 'bear-enter' ? 'Park ranger bear is on the trail...' : animationStep === 'trash-to-seed' ? 'Turning collected trash into a glowing seed...' : animationStep === 'digging' ? 'Digging a cozy hole in the rich soil...' : animationStep === 'planting' ? 'Planting the seed in the forest floor...' : animationStep === 'watering' ? 'Watering and nurturing the new growth...' : animationStep === 'complete' ? 'A new tree joins the canopy!' : 'Planting new forest life...'}
              </h3>
              <p className="text-xs text-[#d8f3dc]">Each cleanup helps restore the trail canopy.</p>
            </div>
          ) : (
            renderForestLandscape()
          )}
        </div>

        <div className="mt-5 flex justify-center">
          <button
            type="button"
            onClick={handlePlantSequence}
            disabled={animationStep !== 'idle' || saplingCount <= 0}
            className="rounded-xl bg-[#FFB703] px-6 py-3 text-sm font-bold text-[#1B4332] shadow-lg transition hover:bg-[#f0ad00] active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <span className="inline-flex items-center gap-2"><Shovel className="h-5 w-5" /> Plant Seed in Forest Floor</span>
          </button>
        </div>

        {selectedTree && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
            <div className="relative w-full max-w-sm rounded-[26px] border border-[#70d596] bg-[#133d2d] p-5 text-left shadow-2xl">
              <button
                type="button"
                onClick={() => setSelectedTree(null)}
                className="absolute right-3 top-3 text-[#d8f3dc] hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>

              <div className="mb-3 flex items-center gap-2 text-lg font-bold text-[#ffb703]">
                <Sparkles className="h-5 w-5" /> Tree History
              </div>

              <div className="space-y-3 text-sm text-[#ebf7ee]">
                <div className="flex items-center gap-3 rounded-xl bg-[#1d503e] p-3">
                  <span className="text-3xl">{treeStageLabels[selectedTree.stage]?.emoji || '🌱'}</span>
                  <div>
                    <div className="text-[10px] uppercase tracking-[0.15em] text-[#bdecc6]">Lifecycle</div>
                    <div className="font-semibold">{selectedTree.stage || getTreeStage(selectedTree)}</div>
                  </div>
                </div>

                <p><strong>Planted On:</strong> {new Date(selectedTree.timestamp || Date.now()).toLocaleDateString()}</p>
                <p><strong>Cleanup Report:</strong> #{selectedTree.cleanupId || 'Trail Maintenance'}</p>
                <p><strong>Forest Role:</strong> {selectedTree.stage === 'Mature Canopy' ? 'Full canopy tree' : selectedTree.stage === 'Sapling' ? 'Growing forest tree' : 'Newly planted sapling'}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
