import React, { useState } from 'react';
import { 
  X, Users, Sliders, History, Download, Upload, Plus, Trash2, 
  RotateCcw, FileText, Check, AlertCircle, Sparkles, Music
} from 'lucide-react';
import { ClassRoom, GameSettings, GameHistoryItem, Student } from '../types';
import { DEFAULT_STUDENT_NAMES } from '../defaultData';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  classes: ClassRoom[];
  currentClassId: string;
  onSelectClass: (id: string) => void;
  onUpdateClasses: (updated: ClassRoom[]) => void;
  settings: GameSettings;
  onUpdateSettings: (settings: GameSettings) => void;
  history: GameHistoryItem[];
  onClearHistory: () => void;
  capturedIds: string[];
  onResetCaptured: () => void;
  onExportStandaloneHTML: () => void;
  customAudioName?: string;
  onUploadAudio?: (file: File) => void;
  onClearCustomAudio?: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  classes,
  currentClassId,
  onSelectClass,
  onUpdateClasses,
  settings,
  onUpdateSettings,
  history,
  onClearHistory,
  capturedIds,
  onResetCaptured,
  onExportStandaloneHTML,
  customAudioName,
  onUploadAudio,
  onClearCustomAudio,
}) => {
  const [activeTab, setActiveTab] = useState<'roster' | 'game' | 'history'>('roster');
  
  // Current active class
  const activeClass = classes.find((c) => c.id === currentClassId) || classes[0];

  // Textarea bulk input
  const [bulkInput, setBulkInput] = useState<string>('');
  const [isBulkMode, setIsBulkMode] = useState<boolean>(false);
  const [newClassName, setNewClassName] = useState<string>('');
  const [showAddClass, setShowAddClass] = useState<boolean>(false);
  const [singleStudentName, setSingleStudentName] = useState<string>('');

  if (!isOpen) return null;

  // Bulk parse student names
  const handleApplyBulkNames = () => {
    const lines = bulkInput
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    if (lines.length === 0) return;

    const newStudents: Student[] = lines.map((name, idx) => {
      // Guess gender by common Vietnamese middle names
      const lower = name.toLowerCase();
      const isGirl = lower.includes('thị') || lower.includes('ngọc') || lower.includes('linh') || lower.includes('anh') || lower.includes('hương') || lower.includes('mai');
      return {
        id: `std_${Date.now()}_${idx}`,
        name,
        gender: isGirl ? 'girl' : 'boy',
        hairStyle: idx % 6,
        hairColor: idx % 3 === 0 ? '#1f2937' : '#111827',
        pantsColor: '#881337',
        shirtColor: '#facc15',
        collarColor: '#881337',
      };
    });

    const updated = classes.map((c) =>
      c.id === activeClass.id ? { ...c, students: newStudents } : c
    );
    onUpdateClasses(updated);
    setIsBulkMode(false);
    setBulkInput('');
  };

  // Add single student
  const handleAddSingleStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!singleStudentName.trim()) return;

    const newStd: Student = {
      id: `std_${Date.now()}`,
      name: singleStudentName.trim(),
      gender: Math.random() > 0.5 ? 'boy' : 'girl',
      hairStyle: Math.floor(Math.random() * 6),
      hairColor: '#1f2937',
      pantsColor: '#881337',
      shirtColor: '#facc15',
      collarColor: '#881337',
    };

    const updated = classes.map((c) =>
      c.id === activeClass.id
        ? { ...c, students: [...c.students, newStd] }
        : c
    );
    onUpdateClasses(updated);
    setSingleStudentName('');
  };

  // Remove single student
  const handleRemoveStudent = (id: string) => {
    const updated = classes.map((c) =>
      c.id === activeClass.id
        ? { ...c, students: c.students.filter((s) => s.id !== id) }
        : c
    );
    onUpdateClasses(updated);
  };

  // Load sample 40 students
  const handleLoadSampleRoster = () => {
    const sampleStudents: Student[] = DEFAULT_STUDENT_NAMES.map((item, idx) => ({
      id: `std_sample_${idx + 1}`,
      name: item.name,
      gender: item.gender,
      hairStyle: idx % 6,
      hairColor: idx % 2 === 0 ? '#1f2937' : '#111827',
      pantsColor: '#881337',
      shirtColor: '#facc15',
      collarColor: '#881337',
    }));

    const updated = classes.map((c) =>
      c.id === activeClass.id ? { ...c, students: sampleStudents } : c
    );
    onUpdateClasses(updated);
  };

  // Create new class
  const handleCreateClass = () => {
    if (!newClassName.trim()) return;
    const newClass: ClassRoom = {
      id: `class_${Date.now()}`,
      name: newClassName.trim(),
      students: DEFAULT_STUDENT_NAMES.slice(0, 30).map((s, idx) => ({
        id: `std_c_${idx}`,
        name: s.name,
        gender: s.gender,
        hairStyle: idx % 6,
        hairColor: '#1f2937',
        pantsColor: '#881337',
        shirtColor: '#facc15',
        collarColor: '#881337',
      })),
    };
    onUpdateClasses([...classes, newClass]);
    onSelectClass(newClass.id);
    setNewClassName('');
    setShowAddClass(false);
  };

  // Delete current class
  const handleDeleteClass = (id: string) => {
    if (classes.length <= 1) {
      alert('Phải giữ ít nhất 1 lớp học!');
      return;
    }
    const remaining = classes.filter((c) => c.id !== id);
    onUpdateClasses(remaining);
    onSelectClass(remaining[0].id);
  };

  // Export roster to TXT
  const handleExportTXT = () => {
    const content = activeClass.students.map((s) => s.name).join('\n');
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Danh-sach-${activeClass.name}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl text-slate-100 flex flex-col max-h-[90vh] overflow-hidden">
        
        {/* Top Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
              ⚙
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Quản Lý & Cài Đặt Trò Chơi</h2>
              <p className="text-xs text-slate-400">Dành cho Giáo viên khảo bài lớp học</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-800 px-6 gap-2 bg-slate-900/60">
          <button
            onClick={() => setActiveTab('roster')}
            className={`flex items-center gap-2 py-3 px-4 border-b-2 font-semibold text-sm transition-colors cursor-pointer ${
              activeTab === 'roster'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Danh sách học sinh ({activeClass.students.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('game')}
            className={`flex items-center gap-2 py-3 px-4 border-b-2 font-semibold text-sm transition-colors cursor-pointer ${
              activeTab === 'game'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sliders className="w-4 h-4" />
            <span>Tùy chỉnh lượt chơi</span>
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`flex items-center gap-2 py-3 px-4 border-b-2 font-semibold text-sm transition-colors cursor-pointer ${
              activeTab === 'history'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <History className="w-4 h-4" />
            <span>Lịch sử khảo bài ({history.length})</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* TAB 1: ROSTER MANAGEMENT */}
          {activeTab === 'roster' && (
            <div className="space-y-5">
              {/* Class Switcher & Add Class */}
              <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-slate-800/60 rounded-2xl border border-slate-700/60">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400 font-medium">Chọn lớp:</span>
                  <select
                    value={activeClass.id}
                    onChange={(e) => onSelectClass(e.target.value)}
                    className="bg-slate-900 border border-slate-700 text-white rounded-xl px-3 py-1.5 text-sm font-semibold focus:outline-none focus:border-emerald-500"
                  >
                    {classes.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.students.length} học sinh)
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  {!showAddClass ? (
                    <button
                      onClick={() => setShowAddClass(true)}
                      className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition-colors cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Thêm lớp mới</span>
                    </button>
                  ) : (
                    <div className="flex items-center gap-1.5">
                      <input
                        type="text"
                        placeholder="Tên lớp (VD: 12A3)..."
                        value={newClassName}
                        onChange={(e) => setNewClassName(e.target.value)}
                        className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white"
                      />
                      <button
                        onClick={handleCreateClass}
                        className="px-2.5 py-1 bg-emerald-600 rounded-lg text-xs font-bold text-white hover:bg-emerald-500"
                      >
                        Lưu
                      </button>
                      <button
                        onClick={() => setShowAddClass(false)}
                        className="px-2 py-1 bg-slate-700 rounded-lg text-xs text-slate-300"
                      >
                        Hủy
                      </button>
                    </div>
                  )}

                  {classes.length > 1 && (
                    <button
                      onClick={() => handleDeleteClass(activeClass.id)}
                      title="Xóa lớp này"
                      className="p-1.5 rounded-lg text-red-400 hover:bg-red-500/20 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Roster Actions (Bulk Paste vs Single Add vs Sample) */}
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setIsBulkMode(!isBulkMode);
                      if (!isBulkMode) {
                        setBulkInput(activeClass.students.map((s) => s.name).join('\n'));
                      }
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-slate-200 transition-colors cursor-pointer"
                  >
                    <FileText className="w-3.5 h-3.5 text-sky-400" />
                    <span>{isBulkMode ? 'Xem danh sách thẻ' : 'Dán từ Excel / Word'}</span>
                  </button>

                  <button
                    onClick={handleLoadSampleRoster}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-amber-300 transition-colors cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Nạp 40 tên mẫu</span>
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleExportTXT}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-medium text-slate-300 transition-colors cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Xuất TXT</span>
                  </button>

                  {capturedIds.length > 0 && (
                    <button
                      onClick={onResetCaptured}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs font-medium text-amber-400 hover:bg-amber-500/20 transition-colors cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Xóa danh sách đã bắt ({capturedIds.length})</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Bulk Textarea Mode */}
              {isBulkMode ? (
                <div className="space-y-3 p-4 bg-slate-800/40 rounded-2xl border border-slate-700/60">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span>Nhập hoặc dán mỗi dòng 1 tên học sinh (từ Excel / Word):</span>
                    <span className="font-bold text-emerald-400">
                      {bulkInput.split('\n').filter((l) => l.trim().length > 0).length} tên
                    </span>
                  </div>
                  <textarea
                    rows={10}
                    value={bulkInput}
                    onChange={(e) => setBulkInput(e.target.value)}
                    placeholder="Đoàn Minh Đức&#10;Nguyễn Bùi Gia Huy&#10;Phương Linh&#10;Quỳnh Anh..."
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-sm text-white font-mono focus:outline-none focus:border-emerald-500"
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => setIsBulkMode(false)}
                      className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700"
                    >
                      Đóng
                    </button>
                    <button
                      onClick={handleApplyBulkNames}
                      className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-600/30"
                    >
                      Cập nhật danh sách
                    </button>
                  </div>
                </div>
              ) : (
                /* Card List of Students */
                <div className="space-y-3">
                  {/* Quick Add Form */}
                  <form onSubmit={handleAddSingleStudent} className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Thêm học sinh mới (nhập tên)..."
                      value={singleStudentName}
                      onChange={(e) => setSingleStudentName(e.target.value)}
                      className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                    />
                    <button
                      type="submit"
                      className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Thêm</span>
                    </button>
                  </form>

                  {/* Student Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 max-h-80 overflow-y-auto p-1">
                    {activeClass.students.map((std, idx) => {
                      const isCaptured = capturedIds.includes(std.id);
                      return (
                        <div
                          key={std.id}
                          className={`flex items-center justify-between p-2.5 rounded-xl border transition-all ${
                            isCaptured
                              ? 'bg-amber-950/20 border-amber-800/40 opacity-70'
                              : 'bg-slate-800/60 border-slate-700/60 hover:bg-slate-800'
                          }`}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="text-xs font-mono text-slate-400 w-5 text-right">
                              {idx + 1}.
                            </span>
                            <span className="text-sm font-semibold text-slate-100 truncate">
                              {std.name}
                            </span>
                            {isCaptured && (
                              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400">
                                Đã gọi
                              </span>
                            )}
                          </div>
                          <button
                            onClick={() => handleRemoveStudent(std.id)}
                            className="p-1 text-slate-500 hover:text-red-400 transition-colors cursor-pointer"
                            title="Xóa học sinh này"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: GAME CUSTOMIZATION */}
          {activeTab === 'game' && (
            <div className="space-y-5">
              {/* Pick count */}
              <div className="flex items-center justify-between p-4 bg-slate-800/50 rounded-2xl border border-slate-700/60">
                <div>
                  <div className="text-sm font-bold text-white">Số học sinh cần gọi mỗi lượt</div>
                  <div className="text-xs text-slate-400">UFO sẽ lần lượt truy bắt đúng số lượng này (mặc định: 2)</div>
                </div>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((cnt) => (
                    <button
                      key={cnt}
                      onClick={() => onUpdateSettings({ ...settings, pickCount: cnt })}
                      className={`w-9 h-9 rounded-xl font-bold text-sm transition-all cursor-pointer ${
                        settings.pickCount === cnt
                          ? 'bg-emerald-500 text-slate-950 shadow-md'
                          : 'bg-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      {cnt}
                    </button>
                  ))}
                </div>
              </div>

              {/* Speed Mode */}
              <div className="flex items-center justify-between p-4 bg-slate-800/50 rounded-2xl border border-slate-700/60">
                <div>
                  <div className="text-sm font-bold text-white">Tốc độ hoạt cảnh</div>
                  <div className="text-xs text-slate-400">Điều chỉnh nhịp điệu UFO rượt đuổi và bắt học sinh</div>
                </div>
                <div className="flex items-center gap-2">
                  {[
                    { id: 'slow', label: 'Thong thả' },
                    { id: 'normal', label: 'Bình thường' },
                    { id: 'fast', label: 'Nhanh kịch tính' },
                  ].map((spd) => (
                    <button
                      key={spd.id}
                      onClick={() => onUpdateSettings({ ...settings, speed: spd.id as 'slow' | 'normal' | 'fast' })}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        settings.speed === spd.id
                          ? 'bg-emerald-500 text-slate-950 shadow-md'
                          : 'bg-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      {spd.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Toggle No-repeat */}
              <div className="flex items-center justify-between p-4 bg-slate-800/50 rounded-2xl border border-slate-700/60">
                <div>
                  <div className="text-sm font-bold text-white">Chế độ không gọi lại học sinh đã bị bắt</div>
                  <div className="text-xs text-slate-400">Loại trừ những bạn đã lên bảng trả bài trong buổi học</div>
                </div>
                <input
                  type="checkbox"
                  checked={settings.noRepeat}
                  onChange={(e) => onUpdateSettings({ ...settings, noRepeat: e.target.checked })}
                  className="w-5 h-5 accent-emerald-500 rounded cursor-pointer"
                />
              </div>

              {/* Toggle Name tags */}
              <div className="flex items-center justify-between p-4 bg-slate-800/50 rounded-2xl border border-slate-700/60">
                <div>
                  <div className="text-sm font-bold text-white">Hiển thị nhãn tên trên đầu học sinh</div>
                  <div className="text-xs text-slate-400">Bảng tên trắng bo tròn bám theo chuyển động đầu nhân vật</div>
                </div>
                <input
                  type="checkbox"
                  checked={settings.showLabels}
                  onChange={(e) => onUpdateSettings({ ...settings, showLabels: e.target.checked })}
                  className="w-5 h-5 accent-emerald-500 rounded cursor-pointer"
                />
              </div>

              {/* Toggle Speech bubbles */}
              <div className="flex items-center justify-between p-4 bg-slate-800/50 rounded-2xl border border-slate-700/60">
                <div>
                  <div className="text-sm font-bold text-white">Bong bóng hội thoại hài hước</div>
                  <div className="text-xs text-slate-400">"Thầy ơi tha em", "Em thuộc bài rồi mà", "Cứu tui với"</div>
                </div>
                <input
                  type="checkbox"
                  checked={settings.showSpeech}
                  onChange={(e) => onUpdateSettings({ ...settings, showSpeech: e.target.checked })}
                  className="w-5 h-5 accent-emerald-500 rounded cursor-pointer"
                />
              </div>

              {/* Music & Sound Control */}
              <div className="p-4 bg-slate-800/50 rounded-2xl border border-slate-700/60 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Music className="w-4 h-4 text-pink-400" />
                    <div className="text-sm font-bold text-white">Nhạc nền đĩa bay & Âm thanh kịch tính</div>
                  </div>
                  {customAudioName && onClearCustomAudio && (
                    <button
                      onClick={onClearCustomAudio}
                      className="text-xs text-slate-400 hover:text-red-400 underline cursor-pointer"
                    >
                      Khôi phục nhạc EDM mặc định
                    </button>
                  )}
                </div>
                <div className="text-xs text-slate-400">
                  {customAudioName
                    ? `Đang kích hoạt file nhạc riêng: "${customAudioName}"`
                    : 'Đang dùng bản nhạc điện tử EDM kịch tính kết hợp đếm ngược hồi hộp và âm thanh hoạt hình hài hước.'}
                </div>
                <div className="flex flex-wrap items-center gap-3 pt-1">
                  <label className="flex items-center gap-2 px-4 py-2 rounded-xl bg-pink-600 hover:bg-pink-500 text-white text-xs font-bold shadow-md cursor-pointer transition-all active:scale-95">
                    <Music className="w-4 h-4" />
                    <span>Tải file nhạc của bạn (MP3 / WAV)</span>
                    <input
                      type="file"
                      accept="audio/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file && onUploadAudio) onUploadAudio(file);
                      }}
                    />
                  </label>
                  <span className="text-xs text-slate-500">Hỗ trợ các định dạng âm thanh phổ biến, lưu tự động trong máy</span>
                </div>
              </div>

              {/* Text Titles */}
              <div className="p-4 bg-slate-800/50 rounded-2xl border border-slate-700/60 space-y-3">
                <div className="text-sm font-bold text-white">Tùy biến tiêu đề bảng kết quả</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-slate-400 block mb-1">Tiêu đề chính:</label>
                    <input
                      type="text"
                      value={settings.resultTitle}
                      onChange={(e) => onUpdateSettings({ ...settings, resultTitle: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 block mb-1">Ghi chú / Tên giáo viên (tùy chọn):</label>
                    <input
                      type="text"
                      placeholder="Để trống hoặc nhập tên giáo viên/trường..."
                      value={settings.teacherCredit}
                      onChange={(e) => onUpdateSettings({ ...settings, teacherCredit: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white"
                    />
                  </div>
                </div>
              </div>

              {/* Download standalone HTML export button */}
              <div className="p-4 bg-emerald-950/40 rounded-2xl border border-emerald-800/60 flex items-center justify-between">
                <div>
                  <div className="text-sm font-bold text-emerald-300">Xuất file HTML độc lập (Offline)</div>
                  <div className="text-xs text-emerald-400/80">Tải trọn vẹn trò chơi về USB / máy tính để dạy không cần mạng</div>
                </div>
                <button
                  onClick={onExportStandaloneHTML}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/30 cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Tải file HTML</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: HISTORY */}
          {activeTab === 'history' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="text-xs text-slate-400">
                  Lịch sử lưu các lượt đã gọi tên trong buổi học:
                </div>
                {history.length > 0 && (
                  <button
                    onClick={onClearHistory}
                    className="flex items-center gap-1.5 text-xs text-red-400 hover:text-red-300 font-semibold px-2 py-1 rounded-lg hover:bg-red-500/10 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Xóa toàn bộ lịch sử</span>
                  </button>
                )}
              </div>

              {history.length === 0 ? (
                <div className="p-8 text-center text-slate-500 text-sm bg-slate-800/30 rounded-2xl border border-slate-800">
                  Chưa có lượt khảo bài nào được ghi nhận. Bắt đầu lượt chơi để xem lịch sử!
                </div>
              ) : (
                <div className="space-y-2.5 max-h-96 overflow-y-auto">
                  {history.map((item, idx) => (
                    <div
                      key={item.id}
                      className="p-3.5 bg-slate-800/60 rounded-xl border border-slate-700/60 flex items-center justify-between"
                    >
                      <div>
                        <div className="text-xs text-slate-400 mb-1">
                          Lượt #{history.length - idx} • {item.className} • {item.timestamp}
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {item.students.map((s, sIdx) => (
                            <span
                              key={s.id}
                              className="px-2.5 py-1 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-bold"
                            >
                              {sIdx + 1}. {s.name}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-800 bg-slate-900/80">
          <span className="text-xs text-slate-500">Mẹo: Nhấn phím <kbd className="px-1.5 py-0.5 bg-slate-800 rounded border border-slate-700 text-slate-300">Esc</kbd> để đóng hộp cài đặt</span>
          <button
            onClick={onClose}
            className="px-6 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-md cursor-pointer"
          >
            Đóng & Lưu
          </button>
        </div>

      </div>
    </div>
  );
};
