import React from 'react';
import { Student, GameSettings } from '../types';
import { RefreshCw, Settings, Sparkles } from 'lucide-react';

interface ResultModalProps {
  students: Student[];
  settings: GameSettings;
  onNewRound: () => void;
  onOpenSettings: () => void;
}

export const ResultModal: React.FC<ResultModalProps> = ({
  students,
  settings,
  onNewRound,
  onOpenSettings,
}) => {
  // Format current date and time (e.g., 09:15 - 14/10/2026)
  const now = new Date();
  const timeStr = now.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  const dateStr = now.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
      {/* Dialog container matching the reference video */}
      <div className="relative w-full max-w-xl bg-white/95 backdrop-blur-md rounded-3xl p-7 shadow-2xl border border-slate-200/80 transform animate-in zoom-in-95 duration-300">
        
        {/* Upper Right Tilted Red Stamp "ĐÃ BẮT" */}
        <div className="absolute top-6 right-7 transform rotate-12 select-none">
          <div className="border-2 border-red-500 rounded-lg px-3 py-1 font-black text-red-600 text-sm tracking-widest bg-red-50/90 shadow-sm uppercase">
            ĐÃ BẮT
          </div>
        </div>

        {/* Header with Alien Badge */}
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xl">🛸</span>
          <span className="text-xs font-bold tracking-wider text-emerald-600 uppercase">
            {settings.resultSubtitle || 'LỆNH TRIỆU TẬP LIÊN HÀNH TINH'}
          </span>
        </div>

        {/* Main Title */}
        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-800 mb-6 tracking-tight">
          {settings.resultTitle || 'Mời các bạn lên bảng trả bài'}
        </h2>

        {/* List of Captured Students */}
        <div className="space-y-3 mb-6">
          {students.map((student, index) => (
            <div
              key={student.id}
              className="flex items-center gap-4 p-3.5 bg-slate-50/90 hover:bg-slate-100/90 rounded-2xl border border-slate-200/60 transition-colors shadow-sm"
            >
              {/* Cartoon Avatar */}
              <div className="relative w-14 h-14 rounded-full bg-gradient-to-tr from-sky-400 to-indigo-500 p-0.5 shadow-md flex-shrink-0">
                <div className="w-full h-full rounded-full bg-sky-50 flex items-center justify-center overflow-hidden">
                  {student.gender === 'girl' ? (
                    <span className="text-2xl" role="img" aria-label="Nữ sinh">
                      👧
                    </span>
                  ) : (
                    <span className="text-2xl" role="img" aria-label="Nam sinh">
                      👦
                    </span>
                  )}
                </div>
              </div>

              {/* Student Info */}
              <div className="flex-1 min-w-0">
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  NGƯỜI THỨ {index + 1}
                </div>
                <div className="text-xl font-bold text-slate-900 truncate">
                  {student.name}
                </div>
              </div>

              {/* Status pill */}
              <div className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Trả bài</span>
              </div>
            </div>
          ))}
        </div>

        {/* Footer Meta & Controls */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-3 border-t border-slate-100">
          <div className="text-xs text-slate-400 text-center sm:text-left">
            <div>{timeStr} - {dateStr}</div>
            {settings.teacherCredit && settings.teacherCredit.trim() ? (
              <div className="font-medium text-slate-500">{settings.teacherCredit}</div>
            ) : null}
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              onClick={onOpenSettings}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 font-semibold text-sm transition-colors shadow-sm active:scale-95"
            >
              <Settings className="w-4 h-4 text-slate-500" />
              <span>Cài đặt</span>
            </button>

            <button
              onClick={onNewRound}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm transition-all shadow-lg shadow-emerald-600/30 active:scale-95 cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Lượt mới (Space)</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
