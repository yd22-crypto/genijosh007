import React, { useState } from 'react';
import { SCIENCE_CONCEPTS } from '../data/scienceData';
import { BookOpen, X, CheckCircle, ArrowRight, Activity, Flame } from 'lucide-react';

interface ScienceEncyclopediaModalProps {
  onClose: () => void;
}

export const ScienceEncyclopediaModal: React.FC<ScienceEncyclopediaModalProps> = ({ onClose }) => {
  const [selectedConceptId, setSelectedConceptId] = useState<string>('rbc');
  const activeConcept = SCIENCE_CONCEPTS.find((c) => c.id === selectedConceptId) || SCIENCE_CONCEPTS[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div className="w-full max-w-3xl bg-slate-900 border-2 border-cyan-800/50 rounded-2xl shadow-2xl overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-sky-950 via-slate-900 to-cyan-950 p-5 border-b border-cyan-900/40 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-cyan-500/20 rounded-xl border border-cyan-500/30">
              <BookOpen className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <h3 className="text-lg font-black text-white">동물과 에너지 과학 도감</h3>
              <p className="text-xs text-cyan-200/70">중학교 2학년 과학 단원 핵심 개념 완벽 정리</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="flex items-center gap-1.5 p-3 bg-slate-950/70 border-b border-slate-800 overflow-x-auto">
          {SCIENCE_CONCEPTS.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelectedConceptId(c.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
                selectedConceptId === c.id
                  ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-950'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              {c.title.split(' (')[0]}
            </button>
          ))}
        </div>

        {/* Active Concept Details */}
        <div className="p-6 max-h-[62vh] overflow-y-auto space-y-5">
          <div className="bg-slate-950/80 p-5 rounded-2xl border border-slate-800">
            <div className="flex items-center gap-2 text-xs font-bold text-cyan-400 uppercase tracking-wider mb-1">
              <Activity className="w-4 h-4" />
              {activeConcept.tag}
            </div>
            <h4 className="text-xl font-black text-white">{activeConcept.title}</h4>
            <p className="text-xs font-semibold text-slate-400 mt-0.5">{activeConcept.subtitle}</p>
            <p className="text-sm text-slate-200 mt-3 leading-relaxed">
              {activeConcept.description}
            </p>
          </div>

          {/* Core Features List */}
          <div className="space-y-2">
            <h5 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              핵심 특징 및 과학적 원리
            </h5>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {activeConcept.features.map((feat, idx) => (
                <div
                  key={idx}
                  className="bg-slate-950/50 border border-slate-800 p-3 rounded-xl flex items-start gap-2.5 text-xs text-slate-300"
                >
                  <CheckCircle className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                  <span>{feat}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Blood Cell Comparison Quick Table */}
          <div className="bg-slate-950/60 border border-slate-800 p-4 rounded-xl">
            <h5 className="text-xs font-bold text-amber-300 mb-2 flex items-center gap-1.5">
              <Flame className="w-4 h-4 text-amber-400" />
              혈액 성분 비교 한눈에 보기
            </h5>
            <div className="overflow-x-auto text-xs">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400">
                    <th className="py-2 px-2">성분</th>
                    <th className="py-2 px-2">모양</th>
                    <th className="py-2 px-2">핵 유무</th>
                    <th className="py-2 px-2">주요 기능</th>
                    <th className="py-2 px-2">게임 내 효과</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-300">
                  <tr>
                    <td className="py-2 px-2 font-bold text-red-400">적혈구</td>
                    <td className="py-2 px-2">오목한 원반</td>
                    <td className="py-2 px-2">없음</td>
                    <td className="py-2 px-2">산소 운반 (헤모글로빈)</td>
                    <td className="py-2 px-2 text-sky-400">플레이어 캐릭터</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-2 font-bold text-slate-200">백혈구</td>
                    <td className="py-2 px-2">불규칙</td>
                    <td className="py-2 px-2 text-emerald-400">있음 (큼)</td>
                    <td className="py-2 px-2">식균 작용 (면역)</td>
                    <td className="py-2 px-2 text-rose-400">장애물 (-3초 패널티)</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-2 font-bold text-yellow-300">혈소판</td>
                    <td className="py-2 px-2">세포 파편</td>
                    <td className="py-2 px-2">없음</td>
                    <td className="py-2 px-2">혈액 응고 & 지혈</td>
                    <td className="py-2 px-2 text-amber-300">보너스 (+500p, +2초)</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-2 font-bold text-amber-100">혈장</td>
                    <td className="py-2 px-2">연노란색 액체</td>
                    <td className="py-2 px-2">-</td>
                    <td className="py-2 px-2">물질 운반 (영양소/노폐물)</td>
                    <td className="py-2 px-2 text-slate-400">혈류 배경 흐름</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-950/80 border-t border-slate-800 flex justify-between items-center">
          <span className="text-xs text-slate-400">
            적혈구의 대모험을 통해 생생하게 체험해보세요!
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-cyan-600 hover:bg-cyan-500 text-xs font-bold text-white rounded-lg transition"
          >
            확인 및 닫기
          </button>
        </div>
      </div>
    </div>
  );
};
