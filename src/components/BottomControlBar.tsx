import React from 'react';
import { Play, Volume2, VolumeX, Maximize2, Minimize2, Settings, Users, Music, X } from 'lucide-react';
import { GameSettings, GamePhase, ClassRoom } from '../types';

interface BottomControlBarProps {
  currentClass: ClassRoom;
  settings: GameSettings;
  gamePhase: GamePhase;
  isFullscreen: boolean;
  customAudioName?: string;
  onUploadAudio?: (file: File) => void;
  onClearCustomAudio?: () => void;
  onStart: () => void;
  onToggleSound: () => void;
  onToggleFullscreen: () => void;
  onOpenSettings: () => void;
  onSetPickCount: (count: number) => void;
}

export const BottomControlBar: React.FC<BottomControlBarProps> = ({
  currentClass,
  settings,
  gamePhase,
  isFullscreen,
  customAudioName,
  onUploadAudio,
  onClearCustomAudio,
  onStart,
  onToggleSound,
  onToggleFullscreen,
  onOpenSettings,
  onSetPickCount,
}) => {
  const isPlaying = gamePhase !== 'IDLE' && gamePhase !== 'RESULTS';

  return (
    <div className="absolute bottom-4 left-4 right-4 z-40 pointer-events-auto">
      <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-3 px-5 py-3 rounded-2xl bg-slate-900/80 backdrop-blur-md border border-slate-700/60 shadow-2xl text-white">
        
        {/* Left: Start Button & Hotkey helper */}
        <div className="flex items-center gap-3">
          <button
            onClick={onStart}
            disabled={isPlaying}
            className={`flex items-center gap-2.5 px-6 py-2.5 rounded-xl font-bold text-base transition-all shadow-lg active:scale-95 cursor-pointer ${
              isPlaying
                ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
                : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/30'
            }`}
          >
            <Play className="w-5 h-5 fill-current" />
            <span>Bắt đầu</span>
          </button>

          <span className="hidden sm:inline text-xs text-slate-400 font-medium">
            hoặc nhấn <kbd className="px-2 py-1 bg-slate-800 rounded border border-slate-600 text-slate-200 font-mono text-xs">Space</kbd> để gọi đĩa bay
          </span>
        </div>

        {/* Center: Pick Count Selector */}
        <div className="flex items-center gap-2 bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-700/60">
          <span className="text-xs font-semibold text-slate-300">Bắt:</span>
          {[1, 2, 3, 4, 5].map((cnt) => (
            <button
              key={cnt}
              disabled={isPlaying}
              onClick={() => onSetPickCount(cnt)}
              className={`w-7 h-7 rounded-lg text-xs font-bold transition-all ${
                settings.pickCount === cnt
                  ? 'bg-emerald-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-700/60'
              } ${isPlaying ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              {cnt}
            </button>
          ))}
          <span className="text-xs text-slate-400">bạn</span>
        </div>

        {/* Right Controls: Class Info, Sound, BGM Upload, Fullscreen, Settings */}
        <div className="flex items-center gap-2.5">
          {/* Class info badge */}
          <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/70 border border-slate-700/50 text-xs font-medium text-slate-300">
            <Users className="w-3.5 h-3.5 text-sky-400" />
            <span className="font-bold text-white">{currentClass.name}</span>
            <span className="text-slate-400">• {currentClass.students.length} hs</span>
          </div>

          {/* Custom BGM / Upload Music Button */}
          <div className="relative flex items-center">
            <label
              title={customAudioName ? `Đang dùng file nhạc: ${customAudioName}` : 'Đang dùng nhạc EDM kịch tính (Nhấn để nạp file MP3 riêng)'}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all border shadow-sm cursor-pointer ${
                customAudioName
                  ? 'bg-pink-950/70 border-pink-500/60 text-pink-300'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border-slate-700/60'
              }`}
            >
              <Music className={`w-4 h-4 ${customAudioName ? 'text-pink-400 animate-pulse' : 'text-slate-400'}`} />
              <span className="hidden sm:inline">
                {customAudioName ? (customAudioName.length > 14 ? customAudioName.substring(0, 11) + '...' : customAudioName) : 'Nhạc kịch tính'}
              </span>
              <input
                type="file"
                accept="audio/*"
                className="hidden"
                disabled={isPlaying}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file && onUploadAudio) onUploadAudio(file);
                }}
              />
            </label>
            {customAudioName && onClearCustomAudio && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onClearCustomAudio();
                }}
                title="Khôi phục nhạc EDM mặc định"
                className="ml-1 p-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Sound Toggle */}
          <button
            onClick={onToggleSound}
            title={settings.soundEnabled ? 'Tắt âm thanh' : 'Bật âm thanh'}
            className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors border border-slate-700/60 shadow-sm cursor-pointer"
          >
            {settings.soundEnabled ? (
              <Volume2 className="w-4 h-4 text-emerald-400" />
            ) : (
              <VolumeX className="w-4 h-4 text-slate-400" />
            )}
          </button>

          {/* Fullscreen Toggle */}
          <button
            onClick={onToggleFullscreen}
            title={isFullscreen ? 'Thu nhỏ' : 'Toàn màn hình'}
            className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors border border-slate-700/60 shadow-sm cursor-pointer"
          >
            {isFullscreen ? (
              <Minimize2 className="w-4 h-4" />
            ) : (
              <Maximize2 className="w-4 h-4" />
            )}
          </button>

          {/* Settings Button */}
          <button
            onClick={onOpenSettings}
            disabled={isPlaying}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-semibold transition-colors border border-slate-700/60 shadow-sm cursor-pointer"
          >
            <Settings className="w-4 h-4 text-amber-400" />
            <span className="hidden sm:inline">Cài đặt</span>
          </button>
        </div>

      </div>
    </div>
  );
};
