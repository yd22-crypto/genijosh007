import React from 'react';
import { GameStage, GameStats } from '../types/game';
import {
  Heart,
  Volume2,
  VolumeX,
  BookOpen,
  Award,
  Zap,
} from 'lucide-react';
import { soundManager } from '../lib/audio';

interface HUDProps {
  stage: GameStage;
  stats: GameStats;
  isMuted: boolean;
  onToggleMute: () => void;
  onOpenScience: () => void;
  onOpenLeaderboard: () => void;
}

export const HUD: React.FC<HUDProps> = ({
  stage,
  stats,
  isMuted,
  onToggleMute,
  onOpenScience,
  onOpenLeaderboard,
}) => {
  const getStageTitle = (s: GameStage) => {
    switch (s) {
      case 'LUNG':
        return {
          title: '1단계: 폐 구역 (폐포 모세혈관)',
          desc: '산소(O₂) 5개를 수집하세요!',
          color: 'from-sky-600 to-blue-700',
          badge: '폐순환 (산소 충전)',
        };
      case 'HEART_OUT':
        return {
          title: '2단계: 심장 통과 (폐정맥 ➔ 좌심실 ➔ 대동맥)',
          desc: '동맥혈이 온몸으로 뿜어져 나갑니다!',
          color: 'from-rose-600 to-red-700',
          badge: '좌심실 펌핑',
        };
      case 'TISSUE_CELLS':
        return {
          title: '3단계: 온몸 조직세포 구역 (1분간 산소 전달)',
          desc: '조직세포에 산소를 전하고 백혈구를 피하세요!',
          color: 'from-amber-600 to-orange-700',
          badge: '온몸순환 (세포 호흡)',
        };
      case 'HEART_IN':
        return {
          title: '4단계: 심장 귀환 (대정맥 ➔ 우심실 ➔ 폐동맥)',
          desc: '정맥혈이 폐로 복귀 중입니다!',
          color: 'from-purple-600 to-indigo-700',
          badge: '우심실 펌핑',
        };
      case 'VICTORY':
        return {
          title: '미션 완료: 폐 복귀 성공!',
          desc: '온몸 혈액 순환 사이클 완료!',
          color: 'from-emerald-600 to-teal-700',
          badge: '순환 성공',
        };
      default:
        return {
          title: '적혈구 대기 중',
          desc: '준비 완료',
          color: 'from-slate-700 to-slate-800',
          badge: '대기',
        };
    }
  };

  const stageInfo = getStageTitle(stage);
  const isArterial = stats.oxygenCollected >= 3 && stage !== 'HEART_IN';

  return (
    <div className="w-full bg-slate-900/90 backdrop-blur-md border border-red-900/40 rounded-xl p-3 shadow-lg flex flex-col gap-2.5">
      {/* Top Row: Current Zone Bar & Quick Actions */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2">
        {/* Stage Badge & Step Path */}
        <div className="flex items-center gap-2">
          <span className={`px-2.5 py-1 rounded-full text-xs font-bold text-white bg-gradient-to-r ${stageInfo.color} shadow-sm animate-pulse`}>
            {stageInfo.badge}
          </span>
          <div className="flex flex-col">
            <span className="text-sm font-bold text-slate-100 flex items-center gap-1.5">
              {stageInfo.title}
            </span>
            <span className="text-xs text-slate-400">{stageInfo.desc}</span>
          </div>
        </div>

        {/* Buttons: Sound, Leaderboard, Science Guide */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={onOpenLeaderboard}
            className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 rounded-lg transition"
            title="실시간 랭킹"
          >
            <Award className="w-3.5 h-3.5" />
            <span>랭킹</span>
          </button>

          <button
            onClick={onOpenScience}
            className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/30 rounded-lg transition"
            title="과학 개념 도감"
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>과학 도감</span>
          </button>

          <button
            onClick={onToggleMute}
            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition border border-slate-700"
            title={isMuted ? '소리 켜기' : '소리 끄기'}
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
          </button>
        </div>
      </div>

      {/* Middle Row: Main Metrics (Time, Score, Oxygen, Blood State) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {/* Metric 1: Overall Time */}
        <div className="bg-slate-950/70 border border-slate-800 rounded-lg p-2 flex flex-col justify-center">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>남은 시간</span>
            {stage === 'TISSUE_CELLS' && (
              <span className="text-amber-400 font-bold">조직세포 구역</span>
            )}
          </div>
          <div className="flex items-baseline gap-1 mt-0.5">
            <span
              className={`text-xl font-black tabular-nums ${
                stats.totalTimeLeft < 15 ? 'text-rose-400 animate-ping' : 'text-slate-100'
              }`}
            >
              {Math.ceil(stats.totalTimeLeft)}
            </span>
            <span className="text-xs text-slate-400">초</span>
            {stage === 'TISSUE_CELLS' && (
              <span className="ml-auto text-xs font-semibold px-1.5 py-0.5 rounded bg-amber-950/80 text-amber-300 border border-amber-600/40">
                1분 미션: {Math.ceil(stats.tissueZoneTimeLeft)}초
              </span>
            )}
          </div>
        </div>

        {/* Metric 2: Oxygen Held */}
        <div className="bg-slate-950/70 border border-slate-800 rounded-lg p-2 flex flex-col justify-center">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>보유 산소 (O₂)</span>
            <span className="text-sky-400 font-bold">
              {stats.oxygenCollected >= 5 ? '완충 완료' : `${stats.oxygenCollected}/5`}
            </span>
          </div>
          <div className="flex items-center gap-1.5 mt-1.5">
            {[1, 2, 3, 4, 5].map((idx) => {
              const active = idx <= stats.oxygenCollected;
              return (
                <div
                  key={idx}
                  className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold transition-all duration-300 ${
                    active
                      ? 'bg-sky-400 text-slate-950 ring-2 ring-sky-300 shadow-sm shadow-sky-400'
                      : 'bg-slate-800 text-slate-600 border border-slate-700'
                  }`}
                >
                  O₂
                </div>
              );
            })}
          </div>
        </div>

        {/* Metric 3: Blood State (동맥혈 vs 정맥혈) */}
        <div className="bg-slate-950/70 border border-slate-800 rounded-lg p-2 flex flex-col justify-center">
          <div className="text-xs text-slate-400">적혈구 상태 (혈액 색상)</div>
          <div className="flex items-center gap-2 mt-1">
            <span
              className={`w-3.5 h-3.5 rounded-full shrink-0 shadow-sm ${
                isArterial
                  ? 'bg-red-500 ring-2 ring-red-400 shadow-red-500'
                  : 'bg-rose-950 ring-2 ring-rose-900 shadow-rose-950'
              }`}
            />
            <span
              className={`text-xs font-bold ${
                isArterial ? 'text-red-400' : 'text-rose-300/80'
              }`}
            >
              {isArterial ? '선홍색 (동맥혈, 산소 풍부)' : '암적색 (정맥혈, 산소 방출)'}
            </span>
          </div>
        </div>

        {/* Metric 4: Score */}
        <div className="bg-slate-950/70 border border-slate-800 rounded-lg p-2 flex flex-col justify-center">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>현재 점수</span>
            <span className="text-emerald-400 flex items-center gap-0.5 text-[10px]">
              <Zap className="w-3 h-3" /> 혈소판 +500p
            </span>
          </div>
          <div className="text-xl font-black text-amber-400 tabular-nums mt-0.5">
            {stats.score.toLocaleString()} <span className="text-xs text-amber-300/80">점</span>
          </div>
        </div>
      </div>

      {/* Circulation Pipeline Visual Indicator */}
      <div className="flex items-center justify-between text-[11px] font-semibold text-slate-400 bg-slate-950/40 px-2 py-1 rounded-md border border-slate-800/60 overflow-x-auto">
        <span className={stage === 'LUNG' ? 'text-sky-400 font-bold underline' : ''}>
          ① 폐(산소 획득)
        </span>
        <span>➔</span>
        <span className={stage === 'HEART_OUT' ? 'text-rose-400 font-bold underline' : ''}>
          ② 심장(좌심실)
        </span>
        <span>➔</span>
        <span className={stage === 'TISSUE_CELLS' ? 'text-amber-400 font-bold underline' : ''}>
          ③ 온몸 조직세포(60초 산소공급)
        </span>
        <span>➔</span>
        <span className={stage === 'HEART_IN' ? 'text-purple-400 font-bold underline' : ''}>
          ④ 심장(우심실)
        </span>
        <span>➔</span>
        <span className={stage === 'VICTORY' ? 'text-emerald-400 font-bold underline' : ''}>
          ⑤ 폐 복귀
        </span>
      </div>
    </div>
  );
};
