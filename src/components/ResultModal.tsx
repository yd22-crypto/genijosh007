import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { GameStage, GameStats } from '../types/game';
import {
  Trophy,
  AlertTriangle,
  RotateCcw,
  Award,
  BookOpen,
  Send,
  CheckCircle2,
  Clock,
  Zap,
  Activity,
} from 'lucide-react';
import { submitGameScore } from '../lib/firebase';

interface ResultModalProps {
  stage: GameStage;
  stats: GameStats;
  onRestart: () => void;
  onOpenScience: () => void;
  onOpenLeaderboard: () => void;
}

export const ResultModal: React.FC<ResultModalProps> = ({
  stage,
  stats,
  onRestart,
  onOpenScience,
  onOpenLeaderboard,
}) => {
  const isVictory = stage === 'VICTORY';
  const [playerName, setPlayerName] = useState(
    () => localStorage.getItem('rbc_player_name') || ''
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Trigger confetti if cleared
  useEffect(() => {
    if (isVictory) {
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#ef4444', '#f59e0b', '#10b981', '#38bdf8', '#a855f7'],
        });
      } catch {
        // no-op
      }
    }
  }, [isVictory]);

  const handleSubmitScore = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!playerName.trim() || hasSubmitted || isSubmitting) return;

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      localStorage.setItem('rbc_player_name', playerName.trim());
      await submitGameScore({
        playerName: playerName.trim(),
        score: stats.score,
        timeLeft: Math.max(0, Math.round(stats.totalTimeLeft)),
        oxygenCollected: stats.oxygenCollected,
        oxygenDelivered: stats.oxygenDelivered,
        plateletsCollected: stats.plateletsCollected,
        wbcCollisions: stats.wbcCollisions,
        isClear: isVictory,
        createdAt: new Date().toISOString(),
      });
      setHasSubmitted(true);
    } catch (err) {
      console.error(err);
      setSubmitError('Firebase 랭킹 저장 중 문제가 발생했습니다. 잠시 후 다시 시도해 주세요.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div className="w-full max-w-xl bg-slate-900 border-2 border-slate-700 rounded-2xl shadow-2xl overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div
          className={`p-6 text-center border-b ${
            isVictory
              ? 'bg-gradient-to-r from-emerald-900 via-teal-800 to-emerald-950 border-emerald-700/50'
              : 'bg-gradient-to-r from-red-950 via-rose-900 to-slate-950 border-rose-800/50'
          }`}
        >
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-slate-900/60 border border-white/20 mb-3 shadow-inner">
            {isVictory ? (
              <Trophy className="w-8 h-8 text-yellow-400" />
            ) : (
              <AlertTriangle className="w-8 h-8 text-rose-400" />
            )}
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white">
            {isVictory ? '혈액 순환 미션 성공!' : '시간 초과: 미션 실패'}
          </h2>
          <p className="text-xs sm:text-sm text-slate-200 mt-1">
            {isVictory
              ? '폐 ➔ 심장 ➔ 온몸 조직세포 ➔ 심장 ➔ 폐 복귀 순환을 완주했습니다!'
              : '제한시간 안에 순환을 완료하지 못했습니다. 다시 도전해보세요!'}
          </p>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5 text-slate-200 text-sm">
          {/* Main Score & Time Display */}
          <div className="grid grid-cols-2 gap-3 bg-slate-950/70 p-4 rounded-xl border border-slate-800 text-center">
            <div>
              <div className="text-xs text-slate-400">최종 점수</div>
              <div className="text-2xl sm:text-3xl font-black text-amber-400 mt-1">
                {stats.score.toLocaleString()} <span className="text-xs text-amber-300">p</span>
              </div>
            </div>
            <div>
              <div className="text-xs text-slate-400">남은 시간</div>
              <div className="text-2xl sm:text-3xl font-black text-sky-400 mt-1">
                {Math.max(0, Math.ceil(stats.totalTimeLeft))} <span className="text-xs text-sky-300">초</span>
              </div>
            </div>
          </div>

          {/* Stats Breakdown */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
            <div className="bg-slate-950/50 p-2.5 rounded-lg border border-slate-800">
              <span className="text-slate-400">산소 수집</span>
              <div className="font-bold text-sky-400 text-sm mt-0.5">
                {stats.oxygenCollected} 개
              </div>
            </div>
            <div className="bg-slate-950/50 p-2.5 rounded-lg border border-slate-800">
              <span className="text-slate-400">조직세포 전달</span>
              <div className="font-bold text-emerald-400 text-sm mt-0.5">
                {stats.oxygenDelivered} 회
              </div>
            </div>
            <div className="bg-slate-950/50 p-2.5 rounded-lg border border-slate-800">
              <span className="text-slate-400">혈소판 (+500p)</span>
              <div className="font-bold text-amber-400 text-sm mt-0.5">
                {stats.plateletsCollected} 개
              </div>
            </div>
            <div className="bg-slate-950/50 p-2.5 rounded-lg border border-slate-800">
              <span className="text-slate-400">백혈구 충돌</span>
              <div className="font-bold text-rose-400 text-sm mt-0.5">
                {stats.wbcCollisions} 회 (-{stats.wbcCollisions * 3}s)
              </div>
            </div>
          </div>

          {/* Firebase Leaderboard Registration Form */}
          <div className="bg-slate-950/80 border border-slate-800 p-4 rounded-xl">
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold text-xs text-slate-200 flex items-center gap-1.5">
                <Award className="w-4 h-4 text-amber-400" />
                Firebase 실시간 랭킹 등록
              </span>
              {hasSubmitted && (
                <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> 등록 완료!
                </span>
              )}
            </div>

            {!hasSubmitted ? (
              <form onSubmit={handleSubmitScore} className="flex gap-2">
                <input
                  type="text"
                  maxLength={30}
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  placeholder="학생 이름 또는 닉네임 입력 (예: 2학년3반 홍길동)"
                  className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-red-500"
                  required
                />
                <button
                  type="submit"
                  disabled={isSubmitting || !playerName.trim()}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-slate-950 font-bold text-xs rounded-lg transition flex items-center gap-1.5 shadow"
                >
                  <Send className="w-3.5 h-3.5" />
                  {isSubmitting ? '등록 중...' : '기록 저장'}
                </button>
              </form>
            ) : (
              <div className="text-xs text-slate-400 flex items-center justify-between">
                <span>[ {playerName} ] 님의 기록이 Firebase에 등록되었습니다.</span>
                <button
                  onClick={onOpenLeaderboard}
                  className="text-amber-400 hover:underline font-semibold"
                >
                  명예의 전당 보기 ➔
                </button>
              </div>
            )}
            {submitError && (
              <p className="text-xs text-rose-400 mt-2">{submitError}</p>
            )}
          </div>

          {/* Educational Science Review */}
          <div className="bg-slate-950/40 border border-slate-800/60 p-3 rounded-xl text-xs text-slate-300 space-y-1">
            <div className="font-bold text-cyan-300 flex items-center gap-1">
              <Activity className="w-3.5 h-3.5" />
              과학 개념 한 줄 복습
            </div>
            <p className="text-slate-400">
              적혈구는 폐에서 산소를 얻어 <strong>선홍색(동맥혈)</strong>이 되고, 조직세포에 산소를 전달하여 에너지(ATP)를 만든 후 <strong>암적색(정맥혈)</strong>으로 변해 다시 심장과 폐로 돌아옵니다.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center gap-2 pt-1">
            <button
              onClick={onRestart}
              className="w-full sm:flex-1 py-3 px-5 rounded-xl font-black text-sm text-white bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 active:scale-98 shadow-lg shadow-red-900/40 transition flex items-center justify-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              다시 도전하기
            </button>

            <button
              onClick={onOpenLeaderboard}
              className="w-full sm:w-auto py-3 px-4 rounded-xl font-bold text-xs text-amber-300 bg-slate-800 hover:bg-slate-700 border border-amber-800/50 transition flex items-center justify-center gap-1.5"
            >
              <Award className="w-4 h-4" />
              전체 랭킹
            </button>

            <button
              onClick={onOpenScience}
              className="w-full sm:w-auto py-3 px-4 rounded-xl font-bold text-xs text-cyan-300 bg-slate-800 hover:bg-slate-700 border border-cyan-800/50 transition flex items-center justify-center gap-1.5"
            >
              <BookOpen className="w-4 h-4" />
              과학 도감
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
