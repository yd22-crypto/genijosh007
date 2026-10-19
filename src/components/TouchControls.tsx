import React from 'react';
import { ArrowUp, ArrowDown, Zap } from 'lucide-react';
import { GameStage } from '../types/game';

interface TouchControlsProps {
  stage: GameStage;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onDeliver: () => void;
  oxygenCount: number;
}

export const TouchControls: React.FC<TouchControlsProps> = ({
  stage,
  onMoveUp,
  onMoveDown,
  onDeliver,
  oxygenCount,
}) => {
  return (
    <div className="w-full flex items-center justify-between gap-4 py-2 px-1">
      {/* Directional buttons */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onPointerDown={onMoveUp}
          className="flex items-center justify-center w-14 h-14 rounded-2xl bg-slate-800/90 active:bg-red-600 text-white border-2 border-slate-700 active:border-red-400 shadow-lg active:scale-95 transition-all text-sm font-bold select-none"
        >
          <ArrowUp className="w-6 h-6" />
        </button>

        <button
          type="button"
          onPointerDown={onMoveDown}
          className="flex items-center justify-center w-14 h-14 rounded-2xl bg-slate-800/90 active:bg-red-600 text-white border-2 border-slate-700 active:border-red-400 shadow-lg active:scale-95 transition-all text-sm font-bold select-none"
        >
          <ArrowDown className="w-6 h-6" />
        </button>
      </div>

      <div className="text-center text-xs text-slate-400 hidden sm:block">
        <span className="font-semibold text-slate-300">키보드 조작:</span> ↑ / ↓ 방향키 (또는 W / S)
        {stage === 'TISSUE_CELLS' && (
          <span className="text-amber-300 ml-2">| 스페이스바: 산소 수동 전달</span>
        )}
      </div>

      {/* Deliver Oxygen button during tissue stage */}
      {stage === 'TISSUE_CELLS' && (
        <button
          type="button"
          onClick={onDeliver}
          disabled={oxygenCount <= 0}
          className={`flex items-center gap-2 px-5 py-3 rounded-2xl font-bold shadow-xl active:scale-95 transition-all select-none ${
            oxygenCount > 0
              ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-emerald-900/50 hover:brightness-110 animate-bounce'
              : 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
          }`}
        >
          <Zap className="w-5 h-5 text-yellow-300" />
          <div className="text-left">
            <div className="text-sm">산소 방출 전달</div>
            <div className="text-[10px] text-emerald-200">남은 산소: {oxygenCount}개</div>
          </div>
        </button>
      )}
    </div>
  );
};
