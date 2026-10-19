import React, { useState, useEffect, useCallback } from 'react';
import { GameStage, GameStats } from './types/game';
import { BloodstreamCanvas } from './components/BloodstreamCanvas';
import { HUD } from './components/HUD';
import { TouchControls } from './components/TouchControls';
import { StartModal } from './components/StartModal';
import { ResultModal } from './components/ResultModal';
import { LeaderboardModal } from './components/LeaderboardModal';
import { ScienceEncyclopediaModal } from './components/ScienceEncyclopediaModal';
import { soundManager } from './lib/audio';
import { testConnection } from './lib/firebase';
import { Flame, Sparkles, Heart } from 'lucide-react';

const INITIAL_STATS: GameStats = {
  score: 0,
  totalTimeLeft: 100, // Overall countdown in seconds
  tissueZoneTimeLeft: 60, // 1 minute in tissue cells zone
  oxygenCollected: 0,
  oxygenDelivered: 0,
  plateletsCollected: 0,
  wbcCollisions: 0,
  totalDistance: 0,
};

export default function App() {
  const [stage, setStage] = useState<GameStage>('READY');
  const [stats, setStats] = useState<GameStats>(INITIAL_STATS);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(() => soundManager.isMuted);

  const [showStartModal, setShowStartModal] = useState<boolean>(true);
  const [showScienceModal, setShowScienceModal] = useState<boolean>(false);
  const [showLeaderboardModal, setShowLeaderboardModal] = useState<boolean>(false);

  // Validate connection to Firestore on boot as required by Firebase skill
  useEffect(() => {
    testConnection();
  }, []);

  const handleStartGame = () => {
    setStats({
      ...INITIAL_STATS,
      totalTimeLeft: 100,
      tissueZoneTimeLeft: 60,
    });
    setStage('LUNG');
    setShowStartModal(false);
    setIsPaused(false);
  };

  const handleRestart = () => {
    setStats({
      ...INITIAL_STATS,
      totalTimeLeft: 100,
      tissueZoneTimeLeft: 60,
    });
    setStage('LUNG');
    setIsPaused(false);
  };

  const handleToggleMute = () => {
    const nextMute = soundManager.toggleMute();
    setIsMuted(nextMute);
  };

  // Keyboard shortcut for escape or pause
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'p' || e.key === 'P') {
        if (stage !== 'READY' && stage !== 'VICTORY' && stage !== 'GAME_OVER') {
          setIsPaused((prev) => !prev);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [stage]);

  const handleDeliverOxygen = useCallback(() => {
    // Space bar trigger already dispatches inside canvas, this supports touch button
    window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Space' }));
  }, []);

  const handleTouchUp = useCallback(() => {
    window.dispatchEvent(new KeyboardEvent('keydown', { code: 'ArrowUp' }));
    setTimeout(() => {
      window.dispatchEvent(new KeyboardEvent('keyup', { code: 'ArrowUp' }));
    }, 120);
  }, []);

  const handleTouchDown = useCallback(() => {
    window.dispatchEvent(new KeyboardEvent('keydown', { code: 'ArrowDown' }));
    setTimeout(() => {
      window.dispatchEvent(new KeyboardEvent('keyup', { code: 'ArrowDown' }));
    }, 120);
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-between p-2 sm:p-4 select-none font-sans">
      {/* App Header */}
      <header className="w-full max-w-5xl flex items-center justify-between py-2 px-1 border-b border-red-950/60 mb-2">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-red-600 to-rose-500 flex items-center justify-center shadow-lg shadow-red-900/40">
            <Heart className="w-5 h-5 text-white animate-pulse" />
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-black text-white flex items-center gap-1.5">
              적혈구의 대모험 <span className="text-red-400 font-extrabold text-sm sm:text-base">: 타임어택</span>
            </h1>
            <p className="text-[11px] text-slate-400">
              중학교 과학 2학년 [동물과 에너지] 혈액 순환 & 혈액 구성 성분 런너
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {stage !== 'READY' && stage !== 'VICTORY' && stage !== 'GAME_OVER' && (
            <button
              onClick={() => setIsPaused((prev) => !prev)}
              className="px-3 py-1 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
            >
              {isPaused ? '계속하기' : '일시정지 (P)'}
            </button>
          )}

          <button
            onClick={() => setShowScienceModal(true)}
            className="hidden sm:flex items-center gap-1 px-3 py-1 text-xs font-semibold rounded-lg bg-red-950/60 hover:bg-red-900/60 text-red-200 border border-red-800/40 transition"
          >
            <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
            과학 도감
          </button>
        </div>
      </header>

      {/* Main Game Arena */}
      <main className="w-full max-w-5xl flex flex-col gap-3">
        {/* HUD Top Status Bar */}
        <HUD
          stage={stage}
          stats={stats}
          isMuted={isMuted}
          onToggleMute={handleToggleMute}
          onOpenScience={() => setShowScienceModal(true)}
          onOpenLeaderboard={() => setShowLeaderboardModal(true)}
        />

        {/* 60FPS Bloodstream Canvas */}
        <div className="relative">
          <BloodstreamCanvas
            stage={stage}
            stats={stats}
            onUpdateStats={setStats}
            onStageChange={setStage}
            isPaused={isPaused}
          />

          {/* Pause Overlay */}
          {isPaused && (
            <div className="absolute inset-0 z-30 bg-black/75 backdrop-blur-sm flex flex-col items-center justify-center gap-3 rounded-xl">
              <div className="text-2xl font-black text-white">일시 정지</div>
              <p className="text-xs text-slate-300">P 키를 누르거나 아래 버튼을 누르면 재개됩니다.</p>
              <button
                onClick={() => setIsPaused(false)}
                className="px-6 py-2.5 bg-red-600 hover:bg-red-500 text-white font-bold text-xs rounded-xl transition shadow-lg shadow-red-950"
              >
                게임 계속하기
              </button>
            </div>
          )}
        </div>

        {/* Touch & On-Screen Controls */}
        <TouchControls
          stage={stage}
          onMoveUp={handleTouchUp}
          onMoveDown={handleTouchDown}
          onDeliver={handleDeliverOxygen}
          oxygenCount={stats.oxygenCollected - stats.oxygenDelivered}
        />
      </main>

      {/* Footer Info */}
      <footer className="w-full max-w-5xl text-center py-2 text-[11px] text-slate-500 border-t border-slate-900 mt-2 flex flex-col sm:flex-row items-center justify-between gap-1">
        <div>
          <span>과학 성취기준: [9과04-03] 혈액의 순환 경로를 알고, 혈액 성분의 기능을 설명할 수 있다.</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-amber-400/80">혈소판 +500p</span>
          <span>•</span>
          <span className="text-emerald-400/80">세포 산소공급 1분 미션</span>
          <span>•</span>
          <span className="text-sky-400/80">Firebase Firestore 랭킹 연동</span>
        </div>
      </footer>

      {/* Modals */}
      {showStartModal && (
        <StartModal
          onStart={handleStartGame}
          onOpenScience={() => setShowScienceModal(true)}
          onOpenLeaderboard={() => setShowLeaderboardModal(true)}
        />
      )}

      {(stage === 'VICTORY' || stage === 'GAME_OVER') && (
        <ResultModal
          stage={stage}
          stats={stats}
          onRestart={handleRestart}
          onOpenScience={() => setShowScienceModal(true)}
          onOpenLeaderboard={() => setShowLeaderboardModal(true)}
        />
      )}

      {showLeaderboardModal && (
        <LeaderboardModal onClose={() => setShowLeaderboardModal(false)} />
      )}

      {showScienceModal && (
        <ScienceEncyclopediaModal onClose={() => setShowScienceModal(false)} />
      )}
    </div>
  );
}
