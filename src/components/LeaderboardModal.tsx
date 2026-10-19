import React, { useEffect, useState } from 'react';
import { Award, Trophy, RotateCw, X, CheckCircle, Clock } from 'lucide-react';
import { getTopLeaderboard, GameScoreRecord } from '../lib/firebase';

interface LeaderboardModalProps {
  onClose: () => void;
}

export const LeaderboardModal: React.FC<LeaderboardModalProps> = ({ onClose }) => {
  const [scores, setScores] = useState<GameScoreRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchScores = async () => {
    setLoading(true);
    setError(null);
    try {
      const records = await getTopLeaderboard(15);
      setScores(records);
    } catch (err) {
      console.error(err);
      setError('Firebase 랭킹 정보를 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchScores();
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div className="w-full max-w-lg bg-slate-900 border-2 border-amber-600/40 rounded-2xl shadow-2xl overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-950 via-slate-900 to-amber-950 p-5 border-b border-amber-800/40 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-amber-500/20 rounded-xl border border-amber-500/30">
              <Trophy className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h3 className="text-lg font-black text-white">명예의 전당 (Firebase 랭킹)</h3>
              <p className="text-xs text-amber-200/70">적혈구 타임어택 최고 기록 Top 15</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchScores}
              disabled={loading}
              className="p-2 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition"
              title="새로고침"
            >
              <RotateCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition"
              title="닫기"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-5 max-h-[60vh] overflow-y-auto space-y-2">
          {loading ? (
            <div className="py-12 text-center text-xs text-slate-400 flex flex-col items-center gap-2">
              <RotateCw className="w-6 h-6 animate-spin text-amber-400" />
              <span>Firebase에서 랭킹을 불러오는 중...</span>
            </div>
          ) : error ? (
            <div className="py-8 text-center text-xs text-rose-400">{error}</div>
          ) : scores.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400">
              아직 등록된 랭킹 기록이 없습니다. 지금 첫 번째 주인공이 되어보세요!
            </div>
          ) : (
            scores.map((s, idx) => {
              const isTop3 = idx < 3;
              const badgeColors = [
                'bg-yellow-500 text-slate-950 font-black',
                'bg-slate-300 text-slate-950 font-bold',
                'bg-amber-700 text-white font-bold',
              ];

              return (
                <div
                  key={s.id || idx}
                  className={`flex items-center justify-between p-3 rounded-xl border transition ${
                    isTop3
                      ? 'bg-slate-950/80 border-amber-600/40 shadow-sm'
                      : 'bg-slate-950/40 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                        isTop3 ? badgeColors[idx] : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {idx + 1}
                    </span>
                    <div>
                      <div className="font-bold text-sm text-slate-100 flex items-center gap-1.5">
                        {s.playerName}
                        {s.isClear && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-400 border border-emerald-800 font-normal">
                            완주
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-slate-400 flex items-center gap-2 mt-0.5">
                        <span>산소배달 {s.oxygenDelivered ?? 0}회</span>
                        <span>•</span>
                        <span>혈소판 {s.plateletsCollected ?? 0}개</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-sm font-black text-amber-400 tabular-nums">
                      {s.score.toLocaleString()} <span className="text-[10px]">p</span>
                    </div>
                    <div className="text-[10px] text-slate-500 flex items-center justify-end gap-1">
                      <Clock className="w-3 h-3" />
                      {s.timeLeft}초 남김
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-950/60 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-xs font-bold text-white rounded-lg transition"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
};
