import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Trees, Shovel, Sparkles, X } from 'lucide-react';

const getTreeStage = (tree) => {
  if (!tree?.timestamp) return 'Seed';

  const plantedAt = new Date(tree.timestamp).getTime();
  if (Number.isNaN(plantedAt)) return 'Seed';

  const ageHours = (Date.now() - plantedAt) / (1000 * 60 * 60);

  if (ageHours < 12) return 'Seed';
  if (ageHours < 72) return 'Sprout';
  if (ageHours < 168) return 'Sapling';
  return 'Mature Canopy';
};

const renderTreeSprite = (tree, index, stageOnly = false) => {
  const stage = tree?.stage || getTreeStage(tree);
  const isSeed = stage === 'Seed';
  const isSprout = stage === 'Sprout';
  const isSapling = stage === 'Sapling';
  const isMature = stage === 'Mature Canopy';

  const size = isSeed ? 52 : isSprout ? 72 : isSapling ? 92 : 132;
  const trunkHeight = isSeed ? 14 : isSprout ? 18 : isSapling ? 26 : 38;
  const canopySize = isSeed ? 22 : isSprout ? 34 : isSapling ? 46 : 64;
  const canopyColor = isSeed ? '#a8d76f' : isSprout ? '#60bb6d' : isSapling ? '#5dbe72' : '#2e7d4d';
  const glow = isMature ? 'rgba(196, 255, 162, 0.7)' : 'rgba(166, 217, 106, 0.35)';

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

      {(isSprout || isSapling) && (
        <div
          className="absolute rounded-full"
          style={{
            background: isSprout ? '#7ed57f' : '#89d889',
            left: '50%',
            bottom: `${trunkHeight + 12}px`,
            transform: 'translateX(-50%)',
            width: `${canopySize * (isSprout ? 0.68 : 0.76)}px`,
            height: `${canopySize * (isSprout ? 0.68 : 0.76)}px`,
            boxShadow: '0 0 16px rgba(255,255,255,0.22)',
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
  const [showVideoOverlay, setShowVideoOverlay] = useState(false);
  const [videoFallback, setVideoFallback] = useState(false);
  const timeoutRefs = useRef([]);
  const plantingCompleteRef = useRef(false);

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
    return () => clearTimers();
  }, []);

  useEffect(() => {
    if (animationStep === 'roots' || animationStep === 'growth' || animationStep === 'mature' || animationStep === 'reveal') {
      const intervalId = setInterval(() => {
        setGrowthProgress((current) => Math.min(current + (animationStep === 'roots' ? 18 : animationStep === 'growth' ? 24 : 20), 100));
      }, 180);
      return () => clearInterval(intervalId);
    }

    if (animationStep === 'idle') {
      setGrowthProgress(0);
    }
  }, [animationStep]);

  const finishPlanting = () => {
    if (plantingCompleteRef.current) return;
    plantingCompleteRef.current = true;
    setShowVideoOverlay(false);
    setAnimationStep('idle');
    setGrowthProgress(100);
    onPlantTree?.();
  };

  const handlePlantSequence = () => {
    if (saplingCount <= 0) {
      alert('You need saplings! Log a cleanup to earn seeds.');
      return;
    }

    clearTimers();
    plantingCompleteRef.current = false;
    setSelectedTree(null);
    setGrowthProgress(0);
    setAnimationStep('seed');
    setVideoFallback(false);
    setShowVideoOverlay(true);

    timeoutRefs.current = [
      setTimeout(() => setAnimationStep('roots'), 1000),
      setTimeout(() => setAnimationStep('growth'), 2600),
      setTimeout(() => setAnimationStep('mature'), 4400),
      setTimeout(() => {
        setAnimationStep('reveal');
        setGrowthProgress(100);
      }, 6200),
      setTimeout(() => finishPlanting(), 8000),
    ];
  };

  const handleVideoEnded = () => {
    finishPlanting();
  };

  const handleVideoError = () => {
    setVideoFallback(true);
  };

  const treeStageLabels = {
    Seed: { emoji: '🌱', label: 'Seed' },
    Sprout: { emoji: '🌿', label: 'Sprout' },
    Sapling: { emoji: '🌿', label: 'Sapling' },
    'Mature Canopy': { emoji: '🌲', label: 'Mature Canopy' },
  };

  const renderForestLandscape = () => (
    <div
      className="relative h-[500px] min-h-[500px] w-full overflow-hidden rounded-[30px] border border-[#35684f] bg-cover bg-center shadow-[inset_0_0_90px_rgba(9,20,13,0.55)]"
      style={{
        backgroundImage:
          "linear-gradient(180deg, rgba(13,21,15,0.22) 0%, rgba(12,26,19,0.32) 20%, rgba(8,20,14,0.58) 100%), radial-gradient(circle at top, rgba(160,244,180,0.18), transparent 25%), linear-gradient(180deg, #2b5e46 0%, #1d4738 24%, #14382d 48%, #0f2a22 100%)",
      }}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(180,255,170,0.16),_transparent_36%),linear-gradient(180deg,_rgba(12,19,16,0.18),_rgba(9,18,13,0.72))]" />
      <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-[#1d3827] via-[#31573b] to-[#446e4d]" />
      <div className="absolute inset-x-0 bottom-14 h-16 rounded-full bg-[#4d7d57]/75 blur-xl" />
      <div className="absolute inset-x-0 bottom-10 h-2 bg-[#4a6c47]/70" />

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
        const xPercent = 12 + ((idx * 76) / Math.max(1, forestTrees.length || 1)) + (idx % 2) * 4;
        const sizeScale = tree.stage === 'Seed' ? 0.9 : tree.stage === 'Sprout' ? 1.05 : tree.stage === 'Sapling' ? 1.2 : 1.6;

        return (
          <button
            key={tree.id || `forest-tree-${idx}`}
            type="button"
            onClick={() => setSelectedTree(tree)}
            className="absolute bottom-[42px] flex -translate-x-1/2 flex-col items-center justify-end transition duration-200 hover:scale-[1.04]"
            style={{
              left: `${Math.min(90, xPercent)}%`,
              transform: `translateX(-50%) scale(${sizeScale})`,
            }}
          >
            {renderTreeSprite(tree, idx, true)}
            <span className="mt-1 rounded-full border border-[#d6f5d9]/20 bg-[#112a1c]/70 px-2 py-1 text-[9px] font-semibold uppercase tracking-[0.12em] text-[#edf9e7] shadow-lg">
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

  const renderCinematicScene = () => {
    const growthValue = animationStep === 'reveal' ? 100 : growthProgress;
    const seedVisible = animationStep === 'seed' || animationStep === 'roots' || animationStep === 'growth' || animationStep === 'mature' || animationStep === 'reveal';
    const rootVisible = animationStep === 'roots' || animationStep === 'growth' || animationStep === 'mature' || animationStep === 'reveal';
    const sproutVisible = animationStep === 'growth' || animationStep === 'mature' || animationStep === 'reveal';
    const canopyVisible = animationStep === 'mature' || animationStep === 'reveal';

    return (
      <div className="relative h-[400px] w-full overflow-hidden rounded-[26px] border border-[#2f3721] bg-[radial-gradient(circle_at_top,_rgba(198,236,165,0.18),transparent_32%),linear-gradient(180deg,#223d31_0%,#173427_30%,#10241d_100%)] shadow-inner">
        <div className="absolute inset-x-0 top-0 h-28 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.18),transparent_56%)]" />
        <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-[#2c3e2b] via-[#3d563c] to-[#4b7058]" />
        <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-[#5c4033] to-[#4a311f]" />
        <div className="absolute inset-x-6 bottom-12 h-4 rounded-full bg-[#5e8a60]/90 shadow-[0_0_30px_rgba(115,164,100,0.55)]" />

        <div className="absolute left-1/2 top-8 h-40 w-40 -translate-x-1/2 rounded-full bg-[#f7d98b]/10 blur-3xl macro-growth-glow" />
        <div className="absolute left-1/2 top-14 h-24 w-[110%] -translate-x-1/2 bg-[linear-gradient(180deg,rgba(255,255,255,0.08),transparent)] rotate-[-2deg]" />

        <div className="absolute inset-0 opacity-80">
          {Array.from({ length: 18 }).map((_, idx) => (
            <span
              key={`particle-${idx}`}
              className="absolute rounded-full bg-[#fef3c7] shadow-[0_0_16px_rgba(255,245,181,0.8)]"
              style={{
                left: `${8 + idx * 5}%`,
                top: `${16 + (idx % 6) * 10}%`,
                width: `${2 + (idx % 3)}px`,
                height: `${2 + (idx % 3)}px`,
                opacity: 0.18 + (idx % 4) * 0.15,
                animation: `floatParticle ${4 + idx * 0.4}s ease-in-out infinite`,
              }}
            />
          ))}
        </div>

        <div className="absolute left-1/2 bottom-[46px] h-28 w-28 -translate-x-1/2 rounded-full bg-[#5c4033] shadow-[0_0_30px_rgba(92,64,51,0.9)]" />
        <div className="absolute left-1/2 bottom-[66px] h-16 w-16 -translate-x-1/2 rounded-full bg-[#3d2b22] opacity-90" />

        {animationStep === 'seed' && (
          <>
            <div className="absolute left-[22%] top-[50%] flex -translate-y-1/2 items-center gap-3 opacity-80">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[#d7f8d0] bg-[#1f3f2d] text-2xl shadow-lg">🧤</div>
              <div className="h-3 w-16 rounded-full bg-[#d6e5d1]/80" />
            </div>
            <div className="absolute right-[20%] top-[52%] flex -translate-y-1/2 items-center gap-3 opacity-80">
              <div className="h-3 w-16 rounded-full bg-[#d6e5d1]/80" />
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[#d7f8d0] bg-[#1f3f2d] text-2xl shadow-lg">👜</div>
            </div>
            <div className="absolute left-[50%] top-[46%] h-8 w-8 -translate-x-1/2 rounded-2xl bg-[#203d2d] shadow-[0_0_25px_rgba(118,164,100,0.6)]" />
            <div className="absolute left-[50%] top-[32%] h-10 w-10 -translate-x-1/2 rounded-full border-4 border-[#d8e4d6]/70 bg-[#eaf3d0] shadow-[0_0_30px_rgba(255,214,94,0.75)]" />
            <div className="absolute left-[50%] top-[24%] text-4xl -translate-x-1/2">✨</div>
          </>
        )}

        {seedVisible && (
          <div className="seed-core absolute left-1/2 top-[22%] h-16 w-16 -translate-x-1/2 rounded-full bg-[radial-gradient(circle,#fdf7ef_0%,#f4d17a_30%,#d7ae41_62%,#8d5a18_100%)] shadow-[0_0_28px_rgba(255,209,104,0.8)]" />
        )}

        {rootVisible && (
          <div className="absolute left-1/2 bottom-[60px] h-24 w-24 -translate-x-1/2">
            <div className="absolute inset-0 rounded-full border-[2px] border-[#73d485]/80 opacity-90" style={{ transform: `scale(${0.72 + growthValue / 180})` }} />
            <div className="absolute left-1/2 top-1/2 h-20 w-20 -translate-x-1/2 -translate-y-1/2 rotate-45 rounded-full border-[2px] border-[#9ae69a]/80 opacity-80" style={{ transform: `translate(-50%, -50%) rotate(45deg) scale(${0.8 + growthValue / 200})` }} />
            <div className="absolute left-1/2 top-1/2 h-24 w-24 -translate-x-1/2 -translate-y-1/2 rounded-full border-[2px] border-[#b1f8a9]/80 opacity-70" style={{ transform: `translate(-50%, -50%) scale(${0.7 + growthValue / 220})` }} />
          </div>
        )}

        {sproutVisible && (
          <div className="absolute left-1/2 bottom-[112px] -translate-x-1/2 transition-all duration-500" style={{ transform: `translateX(-50%) scale(${0.75 + growthValue / 180})` }}>
            <div className="absolute left-1/2 top-10 h-10 w-1.5 -translate-x-1/2 rounded-full bg-[#623d28]" />
            <div className="absolute left-1/2 top-2 h-8 w-8 -translate-x-1/2 rounded-full bg-[#7fdc6e] shadow-[0_0_18px_rgba(126,220,110,0.75)]" />
            <div className="absolute left-[calc(50%-26px)] top-[16px] h-5 w-5 rotate-[-28deg] rounded-full bg-[#7fdc6e] shadow-[0_0_18px_rgba(126,220,110,0.75)]" />
            <div className="absolute left-[calc(50%+8px)] top-[16px] h-5 w-5 rotate-[28deg] rounded-full bg-[#7fdc6e] shadow-[0_0_18px_rgba(126,220,110,0.75)]" />
          </div>
        )}

        {canopyVisible && (
          <div className="absolute left-1/2 bottom-[120px] -translate-x-1/2 transition-all duration-700" style={{ transform: `translateX(-50%) scale(${0.85 + growthValue / 150})` }}>
            <div className="absolute left-1/2 top-[-26px] h-20 w-2 -translate-x-1/2 rounded-full bg-[#6b4633]" />
            <div className="absolute left-1/2 top-[-18px] h-20 w-20 -translate-x-1/2 rounded-full bg-[radial-gradient(circle,#6fcf70_0%,#3e9b58_30%,#23553d_100%)] shadow-[0_0_30px_rgba(168,255,167,0.45)]" />
            <div className="absolute left-[calc(50%-26px)] top-[-6px] h-14 w-14 rounded-full bg-[#5ecb63]" />
            <div className="absolute left-[calc(50%+18px)] top-[-8px] h-14 w-14 rounded-full bg-[#69d279]" />
            <div className="absolute left-[calc(50%-6px)] top-[-26px] h-12 w-12 rounded-full bg-[#7ae383]" />
          </div>
        )}

        {(animationStep === 'mature' || animationStep === 'reveal') && (
          <div className="absolute inset-0">
            <div className="absolute left-1/2 bottom-[110px] h-8 w-8 -translate-x-1/2 rounded-full bg-[#fef3c7] opacity-75 blur-md" />
            <div className="absolute left-[26%] top-[16%] text-4xl text-[#dff7cc] opacity-70 animate-pulse">✦</div>
            <div className="absolute left-[70%] top-[18%] text-4xl text-[#dff7cc] opacity-60 animate-pulse">✦</div>
            <div className="absolute left-[44%] top-[10%] text-4xl text-[#dff7cc] opacity-75 animate-pulse">✦</div>
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      <style>{`
        @keyframes floatParticle {
          0%, 100% { transform: translateY(0px) scale(1); opacity: 0.2; }
          50% { transform: translateY(-18px) scale(1.3); opacity: 0.9; }
        }
        @keyframes seedPulse {
          0%, 100% { transform: translate(-50%, 0) scale(0.96); box-shadow: 0 0 20px rgba(255, 212, 112, 0.5); }
          50% { transform: translate(-50%, -8px) scale(1.08); box-shadow: 0 0 32px rgba(255, 212, 112, 0.9); }
        }
        @keyframes macroGlow {
          0%, 100% { opacity: 0.7; transform: scale(0.96); }
          50% { opacity: 1; transform: scale(1.08); }
        }
        .seed-core { animation: seedPulse 1.2s ease-in-out infinite; }
        .macro-growth-glow { animation: macroGlow 2s ease-in-out infinite; }
      `}</style>

      <div className="relative mx-auto w-full max-w-6xl rounded-[32px] border border-[#38624e] bg-[#12372d] p-3 shadow-[0_24px_60px_rgba(6,18,12,0.38)] sm:p-5">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
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

        <div className="relative h-[500px] min-h-[500px] w-full overflow-hidden rounded-[30px] border border-[#40755e] bg-[#183d31]/70">
          {showVideoOverlay ? (
            <div className="absolute inset-0 z-30 flex items-center justify-center bg-[#081b16]/80 p-4 backdrop-blur-sm">
              <div className="relative h-[400px] w-full max-w-3xl overflow-hidden rounded-[26px] border border-[#7ad7a3]/30 bg-[#102d24] shadow-[0_24px_80px_rgba(0,0,0,0.45)]">
                {videoFallback ? (
                  <div className="h-full w-full">{renderCinematicScene()}</div>
                ) : (
                  <video
                    src="/assets/seed-to-tree-timelapse.webm"
                    autoPlay
                    muted
                    playsInline
                    className="h-full w-full object-cover"
                    onEnded={handleVideoEnded}
                    onError={handleVideoError}
                  />
                )}
                {!videoFallback && <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#081810]/60 via-transparent to-[#0e1d18]/20" />}
              </div>
            </div>
          ) : null}

          {animationStep !== 'idle' && !showVideoOverlay ? (
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-[#102d24]/90 p-4 backdrop-blur-sm">
              <div className="mb-4 w-full max-w-[820px]">{renderCinematicScene()}</div>
              <div className="mb-3 h-2.5 w-48 overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[#A3D65C] via-[#7AD7A3] to-[#FFB703] transition-all duration-300"
                  style={{ width: `${Math.min(100, growthProgress)}%` }}
                />
              </div>
              <h3 className="mb-1 text-lg font-bold text-[#FFB703]">
                {animationStep === 'seed' ? 'Trail cleanup in progress...' : animationStep === 'roots' ? 'Trash transformed into native seed...' : animationStep === 'growth' ? 'Restoring soil and roots...' : animationStep === 'mature' ? 'Native canopy expanding...' : animationStep === 'reveal' ? 'Forest restored.' : 'Planting new forest life...'}
              </h3>
              <p className="text-xs text-[#d8f3dc]">From East Bay cleanup to native restoration and growth.</p>
            </div>
          ) : null}

          {!showVideoOverlay && animationStep === 'idle' ? renderForestLandscape() : null}
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
              <p><strong>Cleanup Report:</strong> {selectedTree.cleanupId ? `#${selectedTree.cleanupId}` : 'Trail Maintenance'}</p>
              <p><strong>Forest Role:</strong> {selectedTree.stage === 'Mature Canopy' ? 'Full canopy tree' : selectedTree.stage === 'Sapling' || selectedTree.stage === 'Sprout' ? 'Growing forest tree' : 'Newly planted seedling'}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
