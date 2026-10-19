import React from 'react';
import {
  Play,
  BookOpen,
  Award,
  Zap,
  ShieldAlert,
  Clock,
  Sparkles,
  Info,
} from 'lucide-react';

interface StartModalProps {
  onStart: () => void;
  onOpenScience: () => void;
  onOpenLeaderboard: () => void;
}

export const StartModal: React.FC<StartModalProps> = ({
  onStart,
  onOpenScience,
  onOpenLeaderboard,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div className="w-full max-w-2xl bg-slate-900 border-2 border-red-800/60 rounded-2xl shadow-2xl overflow-hidden my-auto">
        {/* Banner */}
        <div className="bg-gradient-to-r from-red-900 via-rose-800 to-red-950 p-6 text-center border-b border-red-700/50 relative overflow-hidden">
          <div className="absolute -right-12 -top-12 w-40 h-40 bg-red-600/20 rounded-full blur-2xl" />
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-950/80 border border-red-600/40 text-xs font-bold text-red-200 mb-2">
            <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
            중학교 2학년 과학 [동물과 에너지] 혈액 순환 시뮬레이터
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight drop-shadow-md">
            적혈구의 대모험: 타임어택
          </h1>
          <p className="text-sm sm:text-base text-red-100/90 mt-1.5 font-medium">
            폐에서 산소를 싣고, 온몸 세포에 전달한 후 다시 폐로 돌아오는 순환 미션!
          </p>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5 text-slate-200 text-sm">
          {/* Mission Objective */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4">
            <h3 className="font-bold text-slate-100 flex items-center gap-2 mb-2">
              <Clock className="w-4 h-4 text-rose-400" />
              미션 목표 (순환 4단계)
            </h3>
            <ol className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-300">
              <li className="bg-slate-900/90 p-2.5 rounded-lg border border-slate-800">
                <span className="font-bold text-sky-400">1. 폐 구역:</span> 날아오는 산소(O₂) 5개를 획득하세요. 적혈구가 선홍색(동맥혈)으로 바뀝니다!
              </li>
              <li className="bg-slate-900/90 p-2.5 rounded-lg border border-slate-800">
                <span className="font-bold text-rose-400">2. 심장 통과:</span> 좌심실에서 힘찬 박동과 함께 온몸 대동맥으로 뿜어져 나갑니다.
              </li>
              <li className="bg-slate-900/90 p-2.5 rounded-lg border border-slate-800">
                <span className="font-bold text-amber-400">3. 온몸 조직세포 (1분):</span> 60초 동안 조직세포에 산소를 전달 (+1,000p)! 적혈구가 암적색(정맥혈)으로 변화합니다.
              </li>
              <li className="bg-slate-900/90 p-2.5 rounded-lg border border-slate-800">
                <span className="font-bold text-emerald-400">4. 폐 복귀:</span> 대정맥과 우심실을 거쳐 폐로 복귀하면 미션 완주!
              </li>
            </ol>
          </div>

          {/* Key Elements & Rules */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-sky-950/30 border border-sky-800/40 p-3 rounded-xl flex flex-col justify-between">
              <div>
                <div className="font-bold text-sky-300 text-xs flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-sky-400" />
                  산소 분자 (O₂)
                </div>
                <p className="text-[11px] text-slate-300 mt-1">
                  헤모글로빈과 결합하여 운반. 획득 시 +300점 및 적혈구 선홍색 강화.
                </p>
              </div>
            </div>

            <div className="bg-yellow-950/30 border border-yellow-800/40 p-3 rounded-xl flex flex-col justify-between">
              <div>
                <div className="font-bold text-amber-300 text-xs flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-yellow-400" />
                  혈소판 (보너스 아이템)
                </div>
                <p className="text-[11px] text-slate-300 mt-1">
                  상처 치료 및 혈액 응고! <strong className="text-yellow-300">획득 시 +500점 & 시간 +2초 증가!</strong>
                </p>
              </div>
            </div>

            <div className="bg-rose-950/30 border border-rose-800/40 p-3 rounded-xl flex flex-col justify-between">
              <div>
                <div className="font-bold text-rose-300 text-xs flex items-center gap-1.5">
                  <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
                  백혈구 (장애물)
                </div>
                <p className="text-[11px] text-slate-300 mt-1">
                  식균 작용 세포! <strong className="text-rose-300">충돌 시 시간 3초 감소 및 주춤거림</strong> 발생!
                </p>
              </div>
            </div>
          </div>

          {/* Controls Summary */}
          <div className="bg-slate-950/60 p-3 rounded-xl flex items-center justify-between text-xs text-slate-400 border border-slate-800">
            <div className="flex items-center gap-2">
              <Info className="w-4 h-4 text-slate-300" />
              <span>조작 방법: 위/아래 방향키(↑/↓), W/S, 화면 터치 / 드래그</span>
            </div>
            <div className="text-amber-400 font-semibold">
              Firebase 실시간 랭킹 연동됨
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
            <button
              onClick={onStart}
              className="w-full sm:flex-1 py-3.5 px-6 rounded-xl font-black text-base text-white bg-gradient-to-r from-red-600 via-rose-600 to-red-700 hover:from-red-500 hover:to-red-600 active:scale-98 shadow-lg shadow-red-900/50 transition flex items-center justify-center gap-2"
            >
              <Play className="w-5 h-5 fill-white" />
              게임 시작하기
            </button>

            <button
              onClick={onOpenScience}
              className="w-full sm:w-auto py-3.5 px-5 rounded-xl font-bold text-sm text-cyan-300 bg-slate-800 hover:bg-slate-700 border border-cyan-800/50 transition flex items-center justify-center gap-2"
            >
              <BookOpen className="w-4 h-4" />
              과학 원리 도감
            </button>

            <button
              onClick={onOpenLeaderboard}
              className="w-full sm:w-auto py-3.5 px-5 rounded-xl font-bold text-sm text-amber-300 bg-slate-800 hover:bg-slate-700 border border-amber-800/50 transition flex items-center justify-center gap-2"
            >
              <Award className="w-4 h-4" />
              실시간 랭킹
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
