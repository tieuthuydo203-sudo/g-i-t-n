import { Student, ClassRoom, GameSettings } from './types';

export function generateStandaloneHTML(
  classes: ClassRoom[],
  currentClassId: string,
  settings: GameSettings
): string {
  const currentClass = classes.find(c => c.id === currentClassId) || classes[0];
  const initialDataJSON = JSON.stringify({
    classes,
    currentClassId,
    settings
  });

  return `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>UFO Gọi Tên Học Sinh - Khảo Bài Liên Hành Tinh</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background-color: #0b0f19;
      color: #f8fafc;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      overflow: hidden;
      width: 100vw;
      height: 100vh;
      user-select: none;
      -webkit-user-select: none;
    }
    #game-container {
      position: relative;
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #020617;
    }
    canvas {
      width: 100%;
      height: 100%;
      max-height: 100vh;
      object-fit: contain;
      display: block;
    }
    /* Bottom Bar */
    .bottom-bar {
      position: absolute;
      bottom: 16px;
      left: 16px;
      right: 16px;
      max-width: 1100px;
      margin: 0 auto;
      background: rgba(15, 23, 42, 0.85);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      border: 1px solid rgba(51, 65, 85, 0.7);
      border-radius: 20px;
      padding: 12px 24px;
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      z-index: 30;
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5);
    }
    .btn-start {
      background: #10b981;
      color: #022c22;
      border: none;
      border-radius: 14px;
      padding: 10px 24px;
      font-size: 16px;
      font-weight: 800;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 8px;
      transition: all 0.2s;
      box-shadow: 0 4px 14px rgba(16, 185, 129, 0.4);
    }
    .btn-start:hover:not(:disabled) {
      background: #34d399;
      transform: translateY(-1px);
    }
    .btn-start:disabled {
      background: #475569;
      color: #94a3b8;
      cursor: not-allowed;
      transform: none;
      box-shadow: none;
    }
    .btn-ctrl {
      background: #1e293b;
      color: #cbd5e1;
      border: 1px solid #334155;
      border-radius: 12px;
      padding: 8px 14px;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 6px;
      transition: all 0.2s;
    }
    .btn-ctrl:hover {
      background: #334155;
      color: #ffffff;
    }
    .pick-btn {
      width: 32px;
      height: 32px;
      border-radius: 8px;
      border: none;
      font-size: 13px;
      font-weight: 700;
      cursor: pointer;
      background: #1e293b;
      color: #94a3b8;
      transition: all 0.2s;
    }
    .pick-btn.active {
      background: #10b981;
      color: #022c22;
    }
    /* Modals */
    .modal-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.65);
      backdrop-filter: blur(8px);
      -webkit-backdrop-filter: blur(8px);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
      z-index: 100;
      opacity: 0;
      pointer-events: none;
      transition: opacity 0.25s ease;
    }
    .modal-overlay.active {
      opacity: 1;
      pointer-events: auto;
    }
    .result-card {
      position: relative;
      background: rgba(255, 255, 255, 0.98);
      color: #0f172a;
      width: 100%;
      max-width: 580px;
      border-radius: 28px;
      padding: 32px;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
      border: 1px solid #e2e8f0;
      animation: popIn 0.3s cubic-bezier(0.16, 1, 0.3, 1);
    }
    .stamp-badge {
      position: absolute;
      top: 24px;
      right: 28px;
      transform: rotate(12deg);
      border: 2px solid #ef4444;
      color: #dc2626;
      background: #fef2f2;
      padding: 4px 12px;
      border-radius: 8px;
      font-size: 13px;
      font-weight: 900;
      letter-spacing: 2px;
    }
    .student-item {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 14px 18px;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 18px;
      margin-bottom: 12px;
    }
    .student-avatar {
      width: 52px;
      height: 52px;
      border-radius: 50%;
      background: linear-gradient(135deg, #38bdf8, #6366f1);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 26px;
      flex-shrink: 0;
    }
    @keyframes popIn {
      from { transform: scale(0.92); opacity: 0; }
      to { transform: scale(1); opacity: 1; }
    }
  </style>
</head>
<body>
  <div id="game-container">
    <canvas id="canvas" width="1920" height="1080"></canvas>

    <!-- Bottom Controls -->
    <div class="bottom-bar">
      <div style="display:flex; align-items:center; gap:12px;">
        <button id="btn-start" class="btn-start" onclick="startGame()">
          <span>▶</span> <span>Bắt đầu</span>
        </button>
        <span style="font-size:12px; color:#94a3b8; display:none;" id="hotkey-hint">
          hoặc nhấn <b>Space</b>
        </span>
      </div>

      <div style="display:flex; align-items:center; gap:8px; background:rgba(30,41,59,0.7); padding:6px 12px; border-radius:12px;">
        <span style="font-size:12px; color:#cbd5e1; font-weight:600;">Bắt:</span>
        <button class="pick-btn" onclick="setPickCount(1)">1</button>
        <button class="pick-btn active" onclick="setPickCount(2)">2</button>
        <button class="pick-btn" onclick="setPickCount(3)">3</button>
        <button class="pick-btn" onclick="setPickCount(4)">4</button>
        <button class="pick-btn" onclick="setPickCount(5)">5</button>
        <span style="font-size:12px; color:#94a3b8;">bạn</span>
      </div>

      <div style="display:flex; align-items:center; gap:8px;">
        <div style="font-size:12px; color:#cbd5e1; background:#1e293b; padding:6px 12px; border-radius:10px;" id="class-badge">
          Lớp 12A1 • 38 hs
        </div>
        <button class="btn-ctrl" onclick="toggleSound()" id="sound-btn">🔊 Bật</button>
        <button class="btn-ctrl" onclick="toggleFullscreen()">⛶ Toàn màn hình</button>
        <button class="btn-ctrl" onclick="openSettings()">⚙ Cài đặt</button>
      </div>
    </div>

    <!-- Results Modal -->
    <div id="result-modal" class="modal-overlay">
      <div class="result-card">
        <div class="stamp-badge">ĐÃ BẮT</div>
        <div style="display:flex; align-items:center; gap:6px; margin-bottom:8px;">
          <span>🛸</span>
          <span id="res-subtitle" style="font-size:11px; font-weight:800; color:#059669; letter-spacing:1.5px; text-transform:uppercase;">
            LỆNH TRIỆU TẬP LIÊN HÀNH TINH
          </span>
        </div>
        <h2 id="res-title" style="font-size:26px; font-weight:900; color:#0f172a; margin-bottom:20px;">
          Mời các bạn lên bảng trả bài
        </h2>

        <div id="results-list" style="margin-bottom:24px;"></div>

        <div style="display:flex; align-items:center; justify-content:space-between; border-top:1px solid #f1f5f9; padding-top:16px;">
          <div style="font-size:11px; color:#94a3b8;">
            <div id="res-time">--:--</div>
          </div>
          <div style="display:flex; gap:10px;">
            <button class="btn-ctrl" onclick="openSettings()" style="background:#f1f5f9; color:#334155; border-color:#e2e8f0;">⚙ Cài đặt</button>
            <button class="btn-start" onclick="newRound()" style="padding:8px 20px; font-size:14px;">
              <span>↻ Lượt mới (Space)</span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Settings Modal -->
    <div id="settings-modal" class="modal-overlay">
      <div style="background:#0f172a; border:1px solid #334155; border-radius:24px; padding:24px; width:100%; max-width:650px; max-height:85vh; overflow-y:auto; color:#fff;">
        <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:16px;">
          <h3 style="font-size:18px; font-weight:800;">⚙ Cài đặt & Danh sách học sinh</h3>
          <button onclick="closeSettings()" style="background:transparent; border:none; color:#94a3b8; font-size:20px; cursor:pointer;">✕</button>
        </div>

        <div style="margin-bottom:16px;">
          <label style="display:block; font-size:12px; color:#94a3b8; margin-bottom:6px;">Dán danh sách học sinh (mỗi dòng 1 tên):</label>
          <textarea id="roster-textarea" rows="10" style="width:100%; background:#020617; border:1px solid #334155; border-radius:12px; padding:12px; color:#fff; font-size:13px; font-family:monospace;"></textarea>
        </div>

        <div style="display:flex; justify-content:space-between; align-items:center;">
          <button onclick="loadSampleRoster()" style="background:#334155; color:#fcd34d; border:none; border-radius:10px; padding:8px 16px; font-size:12px; font-weight:700; cursor:pointer;">
            ✨ Nạp 40 tên mẫu
          </button>
          <div style="display:flex; gap:8px;">
            <button onclick="closeSettings()" style="background:#1e293b; color:#cbd5e1; border:none; border-radius:10px; padding:8px 16px; font-size:12px; cursor:pointer;">Đóng</button>
            <button onclick="saveSettingsRoster()" style="background:#10b981; color:#022c22; border:none; border-radius:10px; padding:8px 20px; font-size:12px; font-weight:800; cursor:pointer;">Lưu thay đổi</button>
          </div>
        </div>
      </div>
    </div>
  </div>

  <script>
    // Initial data injected from App
    const initialConfig = ${initialDataJSON};

    // Synthesized Sound Engine
    class MiniSound {
      constructor() {
        this.ctx = null;
        this.enabled = true;
      }
      init() {
        if (!this.ctx) {
          const AudioCtx = window.AudioContext || window.webkitAudioContext;
          if (AudioCtx) this.ctx = new AudioCtx();
        }
        if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();
      }
      warning() {
        if (!this.enabled) return;
        this.init();
        if (!this.ctx) return;
        for (let i = 0; i < 3; i++) {
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = 'sawtooth';
          const t = this.ctx.currentTime + i * 0.22;
          osc.frequency.setValueAtTime(500, t);
          osc.frequency.exponentialRampToValueAtTime(900, t + 0.12);
          gain.gain.setValueAtTime(0, t);
          gain.gain.linearRampToValueAtTime(0.2, t + 0.03);
          gain.gain.linearRampToValueAtTime(0, t + 0.18);
          osc.connect(gain);
          gain.connect(this.ctx.destination);
          osc.start(t);
          osc.stop(t + 0.2);
        }
      }
      whoosh() {
        if (!this.enabled) return;
        this.init();
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.frequency.setValueAtTime(250, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(1200, this.ctx.currentTime + 0.4);
        gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 0.45);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.45);
      }
      pop() {
        if (!this.enabled) return;
        this.init();
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.frequency.setValueAtTime(700, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(100, this.ctx.currentTime + 0.18);
        gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 0.18);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.18);
      }
      beam() {
        if (!this.enabled) return;
        this.init();
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.frequency.setValueAtTime(100, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(350, this.ctx.currentTime + 1.6);
        gain.gain.setValueAtTime(0.01, this.ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.2, this.ctx.currentTime + 0.3);
        gain.gain.linearRampToValueAtTime(0.1, this.ctx.currentTime + 1.6);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(this.ctx.currentTime + 1.6);
      }
      pulse(pitch = 440) {
        if (!this.enabled) return;
        this.init();
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.frequency.setValueAtTime(pitch, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(pitch * 0.7, this.ctx.currentTime + 0.12);
        gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.14);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.15);
      }
      thud() {
        if (!this.enabled) return;
        this.init();
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.frequency.setValueAtTime(130, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(40, this.ctx.currentTime + 0.18);
        gain.gain.setValueAtTime(0.25, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.2);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.2);
      }
      slideWhistle(up = true) {
        if (!this.enabled) return;
        this.init();
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        if (up) {
          osc.frequency.setValueAtTime(320, this.ctx.currentTime);
          osc.frequency.exponentialRampToValueAtTime(1250, this.ctx.currentTime + 0.5);
        } else {
          osc.frequency.setValueAtTime(1150, this.ctx.currentTime);
          osc.frequency.exponentialRampToValueAtTime(280, this.ctx.currentTime + 0.5);
        }
        gain.gain.setValueAtTime(0.01, this.ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.2, this.ctx.currentTime + 0.08);
        gain.gain.linearRampToValueAtTime(0.01, this.ctx.currentTime + 0.5);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.5);
      }
      cartoonTick(pitch = 750) {
        if (!this.enabled) return;
        this.init();
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(pitch, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(pitch * 0.4, this.ctx.currentTime + 0.05);
        gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.06);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.06);
      }
    }
    const snd = new MiniSound();

    // App state
    let state = {
      students: initialConfig.classes[0].students,
      pickCount: initialConfig.settings.pickCount || 2,
      phase: 'IDLE',
      captured: [],
      night: 0
    };

    // Canvas Setup
    const canvas = document.getElementById('canvas');
    const ctx = canvas.getContext('2d');
    const V_W = 1920, V_H = 1080, GROUND_Y = 870, SIDEWALK_Y = 820;

    let actors = [];
    let ufo = { x: 960, y: -200, targetX: 960, targetY: 230, counter: 0, total: 2, tilt: 0, beamAlpha: 0, beamActive: false };
    let targets = [];
    let targetIdx = 0;
    let particles = [];

    function initActors() {
      const tiltAngles = [0.65, -0.75, 1.35, -1.2, 2.7, -2.8, 0.45, -0.55];
      actors = state.students.map((s, idx) => {
        const spacing = (V_W - 240) / Math.max(1, state.students.length);
        const yOff = (idx % 4) * 12;
        return {
          ...s,
          x: 140 + idx * spacing,
          y: SIDEWALK_Y + 15 + yOff,
          baseY: SIDEWALK_Y + 15 + yOff,
          vx: (Math.random() > 0.5 ? 1 : -1) * 0.8,
          scale: 0.95 + (yOff / 50) * 0.15,
          facing: 1,
          action: 'WALK',
          animTimer: Math.random() * 5,
          targetLiftProgress: 0,
          isCaptured: false,
          floatAngle: tiltAngles[idx % tiltAngles.length],
          floatHeight: 0,
          isBystanderFloated: false,
          rotation: 0
        };
      });
      document.getElementById('class-badge').innerText = \`Lớp học • \${actors.length} hs\`;
    }

    function setPickCount(cnt) {
      state.pickCount = cnt;
      document.querySelectorAll('.pick-btn').forEach((b, i) => {
        b.classList.toggle('active', i + 1 === cnt);
      });
    }

    function toggleSound() {
      snd.enabled = !snd.enabled;
      document.getElementById('sound-btn').innerText = snd.enabled ? '🔊 Bật' : '🔇 Tắt';
    }

    function toggleFullscreen() {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(() => {});
      } else {
        document.exitFullscreen().catch(() => {});
      }
    }

    function openSettings() {
      document.getElementById('roster-textarea').value = state.students.map(s => s.name).join('\\n');
      document.getElementById('settings-modal').classList.add('active');
    }
    function closeSettings() {
      document.getElementById('settings-modal').classList.remove('active');
    }
    function saveSettingsRoster() {
      const names = document.getElementById('roster-textarea').value.split('\\n').map(n => n.trim()).filter(n => n.length > 0);
      if (names.length > 0) {
        state.students = names.map((name, i) => ({
          id: 'std_' + Date.now() + '_' + i,
          name,
          gender: i % 2 === 0 ? 'boy' : 'girl'
        }));
        initActors();
      }
      closeSettings();
    }
    function loadSampleRoster() {
      state.students = initialConfig.classes[0].students;
      document.getElementById('roster-textarea').value = state.students.map(s => s.name).join('\\n');
    }

    let cinePhase = 'IDLE';
    let cineTimer = 0;
    let scanX = 960;
    let scanDir = 1;
    let lastPulse = 0;
    let snatchStage = 'LOCK';
    let snatchTimer = 0;
    let snatchProg = 0;

    function startGame() {
      if (state.phase !== 'IDLE' && state.phase !== 'RESULTS') return;
      document.getElementById('result-modal').classList.remove('active');
      document.getElementById('btn-start').disabled = true;
      state.phase = 'WARNING';
      cinePhase = 'WARNING';
      cineTimer = 0;
      snd.warning();

      setTimeout(() => {
        state.phase = 'UFO_ENTER';
        cinePhase = 'UFO_ENTER';
        cineTimer = 0;
        snd.whoosh();
        ufo.y = -240;
        ufo.targetX = V_W / 2;
        ufo.targetY = 220;
        ufo.counter = 0;
        ufo.total = state.pickCount;

        // Pick fair random targets (default 2)
        const shuffled = [...actors].sort(() => Math.random() - 0.5);
        targets = shuffled.slice(0, Math.min(state.pickCount, shuffled.length));
        targetIdx = 0;
        state.captured = [];
      }, 1600);
    }

    function newRound() {
      document.getElementById('result-modal').classList.remove('active');
      state.phase = 'IDLE';
      cinePhase = 'IDLE';
      actors.forEach(a => {
        a.action = 'WALK';
        a.isCaptured = false;
        a.isBystanderFloated = false;
        a.floatHeight = 0;
        a.rotation = 0;
        a.y = a.baseY;
        a.targetLiftProgress = 0;
        a.vy = 0;
      });
      document.getElementById('btn-start').disabled = false;
      startGame();
    }

    // Keyboard bindings
    window.addEventListener('keydown', (e) => {
      if (e.code === 'Space') {
        if (state.phase === 'RESULTS') newRound();
        else if (state.phase === 'IDLE') startGame();
      } else if (e.code === 'Escape') {
        closeSettings();
        document.getElementById('result-modal').classList.remove('active');
      }
    });

    // Animation Loop
    let lastTime = performance.now();
    let ledPhase = 0;
    function loop(now) {
      const dt = Math.min((now - lastTime) / 1000, 0.05);
      lastTime = now;
      ledPhase += dt * 6;

      // Night transition
      if (['WARNING','UFO_ENTER','MASS_LIFT','SUSPENSE_HOLD','SNATCH'].includes(cinePhase)) {
        state.night = Math.min(1, state.night + dt * 0.9);
      } else {
        state.night = Math.max(0, state.night - dt * 0.8);
      }

      // UFO motion
      const dx = ufo.targetX - ufo.x;
      const dy = ufo.targetY - ufo.y;
      ufo.x += dx * Math.min(1, dt * 3.5);
      ufo.y += dy * Math.min(1, dt * 3.5);
      ufo.tilt = Math.max(-0.25, Math.min(0.25, dx * 0.0012));

      if (ufo.beamActive) ufo.beamAlpha = Math.min(1, ufo.beamAlpha + dt * 4);
      else ufo.beamAlpha = Math.max(0, ufo.beamAlpha - dt * 5);

      // --- Cinematic Sequencer: Mass Lift -> Suspense Hold -> Snatch 2 -> Drop ---
      if (cinePhase === 'UFO_ENTER') {
        cineTimer += dt;
        if (cineTimer >= 1.4 && Math.abs(ufo.y - 220) < 60) {
          cinePhase = 'MASS_LIFT';
          cineTimer = 0;
          ufo.beamActive = true;
          snd.beam();
          actors.forEach(a => { a.action = 'LIFTING'; a.isBystanderFloated = true; });
        }
      } else if (cinePhase === 'MASS_LIFT') {
        cineTimer += dt;
        ufo.beamActive = true;
        const prog = Math.min(1, cineTimer / 1.8);
        actors.forEach((a, idx) => {
          if (!a.isCaptured) {
            const h = 130 + ((idx * 37) % 130);
            a.floatHeight = h * prog;
            a.y = a.baseY - a.floatHeight;
            a.rotation = a.floatAngle * prog;
          }
        });
        if (cineTimer >= 2.0) {
          cinePhase = 'SUSPENSE_HOLD';
          cineTimer = 0;
          lastPulse = 0;
          scanX = V_W / 2;
          scanDir = 1;
        }
      } else if (cinePhase === 'SUSPENSE_HOLD') {
        cineTimer += dt;
        ufo.beamActive = true;
        actors.forEach((a, idx) => {
          if (!a.isCaptured) {
            a.y = a.baseY - a.floatHeight + Math.sin(now * 0.004 + idx) * 8;
            a.rotation = a.floatAngle + Math.sin(now * 0.005 + idx * 0.7) * 0.15;
          }
        });

        // Suspense scanner sweep
        scanX += scanDir * dt * 750;
        if (scanX > V_W - 200) { scanX = V_W - 200; scanDir = -1; }
        else if (scanX < 200) { scanX = 200; scanDir = 1; }

        lastPulse += dt;
        if (lastPulse >= 0.55) {
          lastPulse = 0;
          snd.pulse(420 + Math.random() * 80);
        }

        // Hold suspended for 3.5s for suspense
        if (cineTimer >= 3.5) {
          cinePhase = 'SNATCH';
          targetIdx = 0;
          snatchStage = 'LOCK';
          snatchTimer = 0;
          snatchProg = 0;
        }
      } else if (cinePhase === 'SNATCH') {
        snatchTimer += dt;
        ufo.beamActive = true;

        actors.forEach((a, idx) => {
          if (!a.isCaptured && a !== targets[targetIdx]) {
            a.y = a.baseY - a.floatHeight + Math.sin(now * 0.004 + idx) * 8;
            a.rotation = a.floatAngle + Math.sin(now * 0.005 + idx * 0.7) * 0.15;
          }
        });

        const cur = targets[targetIdx];
        if (!cur) {
          cinePhase = 'MASS_DROP';
          cineTimer = 0;
          ufo.beamActive = false;
        } else {
          if (snatchStage === 'LOCK') {
            scanX += (cur.x - scanX) * Math.min(1, dt * 12);
            if (snatchTimer >= 0.7) {
              snatchStage = 'SUCK';
              snatchTimer = 0;
              snatchProg = 0;
            }
          } else if (snatchStage === 'SUCK') {
            snatchProg += dt * 1.6;
            const p = Math.min(1, snatchProg);
            cur.x += (ufo.x - cur.x) * p * 0.4;
            cur.y = cur.baseY - cur.floatHeight + (ufo.y + 70 - (cur.baseY - cur.floatHeight)) * p;
            cur.rotation += dt * 18;

            if (p >= 1) {
              cur.isCaptured = true;
              ufo.counter++;
              snd.pop();
              state.captured.push(cur);
              snatchStage = 'PAUSE';
              snatchTimer = 0;
            }
          } else if (snatchStage === 'PAUSE') {
            if (snatchTimer >= 0.8) {
              targetIdx++;
              if (targetIdx < targets.length) {
                snatchStage = 'LOCK';
                snatchTimer = 0;
              } else {
                cinePhase = 'MASS_DROP';
                cineTimer = 0;
                ufo.beamActive = false;
              }
            }
          }
        }
      } else if (cinePhase === 'MASS_DROP') {
        cineTimer += dt;
        ufo.beamActive = false;

        let anyFalling = false;
        actors.forEach(a => {
          if (!a.isCaptured) {
            if (a.y < a.baseY) {
              anyFalling = true;
              a.vy = (a.vy || 0) + 1600 * dt;
              a.y += a.vy * dt;
              a.rotation += (0 - a.rotation) * Math.min(1, dt * 10);
              if (a.y >= a.baseY) {
                a.y = a.baseY;
                a.vy = 0;
                a.rotation = 0;
                a.action = 'TRIP';
                a.floatHeight = 0;
                snd.thud();
              }
            }
          }
        });

        if (!anyFalling && cineTimer >= 1.4) {
          cinePhase = 'EXIT';
          state.phase = 'EXIT';
          snd.whoosh();
          ufo.targetY = -380;
          ufo.targetX = V_W + 500;
          setTimeout(() => {
            state.phase = 'RESULTS';
            showResults();
          }, 1200);
        }
      }
      }

      // Actor animation
      actors.forEach(a => {
        a.animTimer += dt;
        if (a.action === 'WALK' || a.action === 'PANIC_RUN') {
          a.x += a.vx * dt * 45;
          if (a.x < 110) { a.x = 110; a.vx = Math.abs(a.vx); a.facing = 1; }
          if (a.x > V_W - 110) { a.x = V_W - 110; a.vx = -Math.abs(a.vx); a.facing = -1; }
        }
      });

      // Render Canvas
      ctx.clearRect(0, 0, V_W, V_H);

      // Sky
      const grad = ctx.createLinearGradient(0, 0, 0, 750);
      grad.addColorStop(0, state.night > 0.5 ? '#111827' : '#60a5fa');
      grad.addColorStop(1, state.night > 0.5 ? '#1e1b4b' : '#dbeafe');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, V_W, V_H);

      // City Buildings
      const shops = [
        { x: 30, w: 170, h: 360, name: 'XE BUÝT', bg: '#0284c7', c: '#f8fafc' },
        { x: 210, w: 190, h: 460, name: 'NHÀ SÁCH', bg: '#15803d', c: '#fef3c7' },
        { x: 410, w: 180, h: 420, name: 'CƠM TẤM', bg: '#ea580c', c: '#fed7aa' },
        { x: 600, w: 190, h: 440, name: 'BÁNH MÌ', bg: '#eab308', c: '#fef08a' },
        { x: 950, w: 190, h: 450, name: 'TRÀ SỮA', bg: '#059669', c: '#ccfbf1' },
        { x: 1150, w: 180, h: 460, name: 'HỚT TÓC', bg: '#0f172a', c: '#e2e8f0' },
        { x: 1340, w: 190, h: 430, name: 'BÚN CHẢ', bg: '#65a30d', c: '#ecfccb' },
        { x: 1540, w: 180, h: 450, name: 'KEM', bg: '#db2777', c: '#fce7f3' },
        { x: 1730, w: 180, h: 420, name: 'ĐIỆN THOẠI', bg: '#0284c7', c: '#e0f2fe' }
      ];
      shops.forEach(sh => {
        ctx.fillStyle = sh.c;
        ctx.fillRect(sh.x, SIDEWALK_Y - sh.h, sh.w, sh.h);
        for (let i = 0; i < 3; i++) {
          ctx.fillStyle = state.night > 0.3 ? '#fef08a' : '#93c5fd';
          ctx.fillRect(sh.x + 30, SIDEWALK_Y - sh.h + 40 + i * 80, 45, 50);
          ctx.fillRect(sh.x + sh.w - 75, SIDEWALK_Y - sh.h + 40 + i * 80, 45, 50);
        }
        ctx.fillStyle = sh.bg;
        ctx.fillRect(sh.x + 10, SIDEWALK_Y - 100, sh.w - 20, 48);
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 20px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(sh.name, sh.x + sh.w / 2, SIDEWALK_Y - 70);
      });

      // Tree at 870
      ctx.fillStyle = '#78350f'; ctx.fillRect(860, SIDEWALK_Y - 180, 20, 180);
      ctx.fillStyle = '#16a34a'; ctx.beginPath(); ctx.arc(870, SIDEWALK_Y - 240, 70, 0, Math.PI * 2); ctx.fill();

      // Sidewalk & Road
      ctx.fillStyle = state.night > 0.5 ? '#475569' : '#cbd5e1'; ctx.fillRect(0, SIDEWALK_Y, V_W, GROUND_Y - SIDEWALK_Y);
      ctx.fillStyle = state.night > 0.5 ? '#1e293b' : '#334155'; ctx.fillRect(0, GROUND_Y, V_W, V_H - GROUND_Y);

      // Immense Wide Tractor Beam covering all students (width 1600)
      if (ufo.beamAlpha > 0.05) {
        const bGrad = ctx.createLinearGradient(ufo.x, ufo.y + 70, ufo.x, GROUND_Y);
        bGrad.addColorStop(0, \`rgba(56, 189, 248, \${0.88 * ufo.beamAlpha})\`);
        bGrad.addColorStop(0.4, \`rgba(45, 212, 191, \${0.5 * ufo.beamAlpha})\`);
        bGrad.addColorStop(1, \`rgba(20, 184, 166, \${0.2 * ufo.beamAlpha})\`);
        ctx.fillStyle = bGrad;
        ctx.beginPath();
        ctx.moveTo(ufo.x - 80, ufo.y + 70);
        ctx.lineTo(ufo.x + 80, ufo.y + 70);
        ctx.lineTo(ufo.x + 800, GROUND_Y);
        ctx.lineTo(ufo.x - 800, GROUND_Y);
        ctx.closePath();
        ctx.fill();

        // Beam ground pool
        ctx.fillStyle = \`rgba(103, 232, 249, \${0.5 * ufo.beamAlpha})\`;
        ctx.beginPath();
        ctx.ellipse(ufo.x, GROUND_Y, 800, 48, 0, 0, Math.PI * 2);
        ctx.fill();
      }

      // Suspense Laser Scanner
      if (['SUSPENSE_HOLD', 'SNATCH'].includes(cinePhase) && ufo.beamAlpha > 0.1) {
        const isLock = cinePhase === 'SNATCH' && (snatchStage === 'LOCK' || snatchStage === 'SUCK');
        ctx.strokeStyle = isLock ? '#ef4444' : '#eab308';
        ctx.lineWidth = isLock ? 4 : 2;
        ctx.beginPath();
        ctx.moveTo(ufo.x, ufo.y + 70);
        ctx.lineTo(scanX, GROUND_Y - 140);
        ctx.stroke();

        // Reticle
        ctx.strokeRect(scanX - 35, GROUND_Y - 175, 70, 70);
        ctx.fillStyle = isLock ? '#ef4444' : '#fef08a';
        ctx.font = 'bold 12px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(isLock ? 'LOCKED' : 'QUÉT...', scanX, GROUND_Y - 185);
      }

      // Students (Áo thể thao vàng ngắn tay cổ bẻ đỏ đô, quần đỏ đô)
      actors.forEach(a => {
        if (!a.isCaptured) {
          ctx.save();
          ctx.translate(a.x, a.y);
          ctx.scale(a.scale * a.facing, a.scale);
          ctx.rotate(a.rotation);

          // Áo thể thao vàng (#facc15)
          ctx.fillStyle = '#facc15';
          ctx.fillRect(-13, -72, 26, 36);

          // Cổ bẻ đỏ đô (#881337)
          ctx.fillStyle = '#881337';
          ctx.beginPath();
          ctx.moveTo(-10, -74); ctx.lineTo(0, -60); ctx.lineTo(-4, -60); ctx.lineTo(-12, -72); ctx.fill();
          ctx.beginPath();
          ctx.moveTo(10, -74); ctx.lineTo(0, -60); ctx.lineTo(4, -60); ctx.lineTo(12, -72); ctx.fill();

          // Tay áo vàng ngắn tay viền đỏ
          ctx.fillStyle = '#facc15';
          ctx.fillRect(-17, -70, 5, 14);
          ctx.fillRect(12, -70, 5, 14);
          ctx.fillStyle = '#881337';
          ctx.fillRect(-17, -58, 5, 3);
          ctx.fillRect(12, -58, 5, 3);

          // Head & Hair
          ctx.fillStyle = '#fde68a'; ctx.beginPath(); ctx.arc(0, -86, 16, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = '#1e293b'; ctx.beginPath(); ctx.arc(0, -90, 16, Math.PI, Math.PI * 2); ctx.fill();

          // Quần màu đỏ đô (#881337) có sọc trắng
          ctx.fillStyle = '#881337';
          const legSwing = Math.sin(a.animTimer * 10) * 8;
          ctx.fillRect(-8, -36, 7, 26 + legSwing);
          ctx.fillRect(2, -36, 7, 26 - legSwing);
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(-8, -36, 2, 24);
          ctx.fillRect(7, -36, 2, 24);

          ctx.restore();

          // Name Tag (Drawn horizontal)
          ctx.fillStyle = '#ffffff';
          const nw = ctx.measureText(a.name).width + 20;
          ctx.fillRect(a.x - nw / 2, a.y - 120 * a.scale, nw, 24);
          ctx.strokeStyle = '#cbd5e1'; ctx.strokeRect(a.x - nw / 2, a.y - 120 * a.scale, nw, 24);
          ctx.fillStyle = '#0f172a'; ctx.font = 'bold 13px sans-serif'; ctx.textAlign = 'center';
          ctx.fillText(a.name, a.x, a.y - 104 * a.scale);
        }
      });

      // Large UFO Saucer (330px width!)
      ctx.save();
      ctx.translate(ufo.x, ufo.y);
      ctx.rotate(ufo.tilt);
      // Cockpit Dome & Alien
      ctx.fillStyle = 'rgba(56, 189, 248, 0.9)';
      ctx.beginPath(); ctx.ellipse(0, -14, 125, 95, 0, Math.PI, 0); ctx.fill();
      // Alien
      ctx.fillStyle = '#4ade80'; ctx.beginPath(); ctx.ellipse(0, -42, 20, 24, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#0f172a';
      ctx.beginPath(); ctx.ellipse(-7, -44, 6, 9, 0.3, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(7, -44, 6, 9, -0.3, 0, Math.PI * 2); ctx.fill();
      // Large Hull
      ctx.fillStyle = '#e2e8f0'; ctx.beginPath(); ctx.ellipse(0, 16, 330, 68, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#475569'; ctx.beginPath(); ctx.ellipse(0, 38, 300, 52, 0, 0, Math.PI * 2); ctx.fill();
      // LEDs
      const colors = ['#ef4444', '#f59e0b', '#10b981', '#06b6d4', '#6366f1', '#ec4899'];
      for (let i = 0; i < 14; i++) {
        const ang = (i / 14) * Math.PI;
        ctx.fillStyle = colors[Math.floor((i + ledPhase) % colors.length)];
        ctx.beginPath();
        ctx.arc(Math.cos(ang) * 285, 18 + Math.sin(ang) * 44, 7, 0, Math.PI * 2);
        ctx.fill();
      }
      // Counter HUD
      ctx.fillStyle = '#022c22'; ctx.fillRect(-65, 0, 130, 42);
      ctx.strokeStyle = '#10b981'; ctx.lineWidth = 2; ctx.strokeRect(-65, 0, 130, 42);
      ctx.fillStyle = '#34d399'; ctx.font = 'bold 24px monospace'; ctx.textAlign = 'center';
      ctx.fillText(\`\${ufo.counter}/\${ufo.total}\`, 0, 26);
      ctx.restore();

      requestAnimationFrame(loop);
    }

    function showResults() {
      const now = new Date();
      document.getElementById('res-time').innerText = now.toLocaleTimeString('vi-VN', { hour:'2-digit', minute:'2-digit' }) + ' - ' + now.toLocaleDateString('vi-VN');
      const listEl = document.getElementById('results-list');
      listEl.innerHTML = '';
      state.captured.forEach((std, i) => {
        const item = document.createElement('div');
        item.className = 'student-item';
        item.innerHTML = \`
          <div class="student-avatar">\${std.gender === 'girl' ? '👧' : '👦'}</div>
          <div>
            <div style="font-size:11px; font-weight:800; color:#94a3b8; text-transform:uppercase;">NGƯỜI THỨ \${i + 1}</div>
            <div style="font-size:20px; font-weight:900; color:#0f172a;">\${std.name}</div>
          </div>
        \`;
        listEl.appendChild(item);
      });
      document.getElementById('result-modal').classList.add('active');
      document.getElementById('btn-start').disabled = false;
    }

    // Start
    initActors();
    requestAnimationFrame(loop);
  </script>
</body>
</html>`;
}
