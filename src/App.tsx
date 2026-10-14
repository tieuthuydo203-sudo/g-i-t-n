import React, { useState, useEffect, useCallback } from 'react';
import { GameCanvas } from './game/GameCanvas';
import { BottomControlBar } from './components/BottomControlBar';
import { ResultModal } from './components/ResultModal';
import { SettingsModal } from './components/SettingsModal';
import { ClassRoom, GameSettings, GamePhase, GameHistoryItem, Student } from './types';
import { INITIAL_CLASSES, DEFAULT_SETTINGS } from './defaultData';
import { sound } from './soundEngine';
import { generateStandaloneHTML } from './standaloneGenerator';

export default function App() {
  // 1. Persistent State with localStorage
  const [classes, setClasses] = useState<ClassRoom[]>(() => {
    try {
      const saved = localStorage.getItem('ufo_classes_v3');
      if (saved) return JSON.parse(saved);
    } catch {}
    return INITIAL_CLASSES;
  });

  const [currentClassId, setCurrentClassId] = useState<string>(() => {
    try {
      const saved = localStorage.getItem('ufo_class_id_v3');
      if (saved) return saved;
    } catch {}
    return INITIAL_CLASSES[0].id;
  });

  const [settings, setSettings] = useState<GameSettings>(() => {
    try {
      const saved = localStorage.getItem('ufo_settings_v3');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.teacherCredit && parsed.teacherCredit.toLowerCase().includes('hổi')) {
          parsed.teacherCredit = '';
        }
        return parsed;
      }
    } catch {}
    return DEFAULT_SETTINGS;
  });

  const [history, setHistory] = useState<GameHistoryItem[]>(() => {
    try {
      const saved = localStorage.getItem('ufo_history_v3');
      if (saved) return JSON.parse(saved);
    } catch {}
    return [];
  });

  const [capturedIds, setCapturedIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('ufo_captured_ids_v3');
      if (saved) return JSON.parse(saved);
    } catch {}
    return [];
  });

  // 2. Active Class & Available Students
  const activeClass = classes.find((c) => c.id === currentClassId) || classes[0] || INITIAL_CLASSES[0];

  // If noRepeat is on, filter out already captured students
  const eligibleStudents = settings.noRepeat
    ? activeClass.students.filter((s) => !capturedIds.includes(s.id))
    : activeClass.students;

  // 3. Transient Game State
  const [gamePhase, setGamePhase] = useState<GamePhase>('IDLE');
  const [currentCaptured, setCurrentCaptured] = useState<Student[]>([]);
  const [resultStudents, setResultStudents] = useState<Student[]>([]);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  // Custom Background Audio uploaded by teacher
  const [customAudioName, setCustomAudioName] = useState<string>(() => {
    try {
      return localStorage.getItem('ufo_custom_audio_name') || '';
    } catch {
      return '';
    }
  });

  useEffect(() => {
    try {
      const dataUrl = localStorage.getItem('ufo_custom_audio_data');
      if (dataUrl) {
        sound.setCustomAudio(dataUrl);
      }
    } catch {}
  }, []);

  const handleUploadAudio = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      if (result) {
        sound.setCustomAudio(result);
        setCustomAudioName(file.name);
        try {
          if (result.length < 5 * 1024 * 1024) {
            localStorage.setItem('ufo_custom_audio_data', result);
            localStorage.setItem('ufo_custom_audio_name', file.name);
          }
        } catch {}
      }
    };
    reader.readAsDataURL(file);
  }, []);

  const handleClearCustomAudio = useCallback(() => {
    sound.setCustomAudio(null);
    setCustomAudioName('');
    try {
      localStorage.removeItem('ufo_custom_audio_data');
      localStorage.removeItem('ufo_custom_audio_name');
    } catch {}
  }, []);

  // Sync settings with Sound Engine
  useEffect(() => {
    sound.setEnabled(settings.soundEnabled);
    sound.setVolume(settings.soundVolume);
  }, [settings.soundEnabled, settings.soundVolume]);

  // Save changes to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('ufo_classes_v3', JSON.stringify(classes));
      localStorage.setItem('ufo_class_id_v3', currentClassId);
      localStorage.setItem('ufo_settings_v3', JSON.stringify(settings));
      localStorage.setItem('ufo_history_v3', JSON.stringify(history));
      localStorage.setItem('ufo_captured_ids_v3', JSON.stringify(capturedIds));
    } catch {}
  }, [classes, currentClassId, settings, history, capturedIds]);

  // Fullscreen state detector
  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  // 4. Game Action Handlers
  const handleStartGame = useCallback(() => {
    if (gamePhase !== 'IDLE' && gamePhase !== 'RESULTS') return;

    if (activeClass.students.length === 0) {
      alert('Danh sách lớp hiện tại chưa có học sinh nào! Hãy mở Cài đặt để thêm học sinh.');
      setIsSettingsOpen(true);
      return;
    }

    if (settings.noRepeat && eligibleStudents.length === 0) {
      alert('Tất cả học sinh trong lớp đã được gọi một lượt! Đang tự động làm mới danh sách gọi.');
      setCapturedIds([]);
      return;
    }

    // Begin Game Sequence!
    setCurrentCaptured([]);
    setResultStudents([]);
    setGamePhase('WARNING');

    // Warning alert sound & visual for 1.6 seconds, then UFO swoops in
    setTimeout(() => {
      setGamePhase('UFO_ENTER');
    }, 1600);
  }, [gamePhase, activeClass.students.length, settings.noRepeat, eligibleStudents.length]);

  const handleCaptureOne = useCallback((student: Student, count: number) => {
    setCurrentCaptured((prev) => [...prev, student]);
    // Mark student ID in session history
    setCapturedIds((prev) => (prev.includes(student.id) ? prev : [...prev, student.id]));
  }, []);

  const handleSequenceComplete = useCallback(
    (results: Student[]) => {
      setResultStudents(results);
      setGamePhase('UFO_EXIT');

      // Add to persistent History
      const now = new Date();
      const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')} - ${now.getDate().toString().padStart(2, '0')}/${(now.getMonth() + 1).toString().padStart(2, '0')}/${now.getFullYear()}`;
      const historyItem: GameHistoryItem = {
        id: `hist_${Date.now()}`,
        timestamp: timeStr,
        className: activeClass.name,
        students: results.map((r) => ({ id: r.id, name: r.name, gender: r.gender })),
      };
      setHistory((prev) => [historyItem, ...prev]);

      // UFO leaves and Result Modal appears!
      setTimeout(() => {
        setGamePhase('RESULTS');
        sound.playResultFanfare();
      }, 1500);
    },
    [activeClass.name]
  );

  const handleNewRound = useCallback(() => {
    setGamePhase('IDLE');
    setCurrentCaptured([]);
    setResultStudents([]);
    // Slight tick to ensure IDLE reset before restarting
    setTimeout(() => {
      handleStartGame();
    }, 100);
  }, [handleStartGame]);

  const handleToggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  const handleToggleSound = () => {
    setSettings((prev) => ({ ...prev, soundEnabled: !prev.soundEnabled }));
  };

  const handleSetPickCount = (count: number) => {
    setSettings((prev) => ({ ...prev, pickCount: count }));
  };

  const handleExportStandaloneHTML = () => {
    const htmlContent = generateStandaloneHTML(classes, currentClassId, settings);
    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'ufo-goi-ten-hoc-sinh.html';
    a.click();
    URL.revokeObjectURL(url);
  };

  // 5. Global Keyboard Shortcuts: Space (Start / New Round), Esc (Close Modal)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in input or textarea
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }

      if (e.code === 'Space') {
        e.preventDefault();
        if (gamePhase === 'RESULTS') {
          handleNewRound();
        } else if (gamePhase === 'IDLE') {
          handleStartGame();
        }
      } else if (e.code === 'Escape') {
        if (isSettingsOpen) {
          setIsSettingsOpen(false);
        }
      } else if (e.code === 'KeyF') {
        handleToggleFullscreen();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gamePhase, isSettingsOpen, handleStartGame, handleNewRound]);

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-slate-950 text-slate-100 flex flex-col items-center justify-center">
      {/* 2D Canvas Scene (City, Students, UFO, Tractor Beam) */}
      <GameCanvas
        students={activeClass.students}
        settings={settings}
        gamePhase={gamePhase}
        capturedStudents={currentCaptured}
        onCaptureOne={handleCaptureOne}
        onSequenceComplete={handleSequenceComplete}
      />

      {/* Bottom Control Bar during Day / Idle */}
      <BottomControlBar
        currentClass={activeClass}
        settings={settings}
        gamePhase={gamePhase}
        isFullscreen={isFullscreen}
        customAudioName={customAudioName}
        onUploadAudio={handleUploadAudio}
        onClearCustomAudio={handleClearCustomAudio}
        onStart={handleStartGame}
        onToggleSound={handleToggleSound}
        onToggleFullscreen={handleToggleFullscreen}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onSetPickCount={handleSetPickCount}
      />

      {/* Result Dialog Modal when capture finishes */}
      {gamePhase === 'RESULTS' && resultStudents.length > 0 && (
        <ResultModal
          students={resultStudents}
          settings={settings}
          onNewRound={handleNewRound}
          onOpenSettings={() => setIsSettingsOpen(true)}
        />
      )}

      {/* Teacher Settings & Roster Management Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        classes={classes}
        currentClassId={currentClassId}
        onSelectClass={setCurrentClassId}
        onUpdateClasses={setClasses}
        settings={settings}
        onUpdateSettings={setSettings}
        history={history}
        onClearHistory={() => setHistory([])}
        capturedIds={capturedIds}
        onResetCaptured={() => setCapturedIds([])}
        onExportStandaloneHTML={handleExportStandaloneHTML}
        customAudioName={customAudioName}
        onUploadAudio={handleUploadAudio}
        onClearCustomAudio={handleClearCustomAudio}
      />
    </div>
  );
}
