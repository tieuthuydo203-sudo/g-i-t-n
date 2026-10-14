import React, { useEffect, useRef, useCallback } from 'react';
import { Student, StudentActor, GamePhase, GameSettings } from '../types';
import { FUNNY_SPEECHES } from '../defaultData';
import { sound } from '../soundEngine';

interface GameCanvasProps {
  students: Student[];
  settings: GameSettings;
  gamePhase: GamePhase;
  capturedStudents: Student[];
  onCaptureOne: (student: Student, currentCount: number) => void;
  onSequenceComplete: (results: Student[]) => void;
}

export const GameCanvas: React.FC<GameCanvasProps> = ({
  students,
  settings,
  gamePhase,
  capturedStudents,
  onCaptureOne,
  onSequenceComplete,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Virtual game dimensions (16:9 standard for crisp rendering on screens/projectors)
  const V_WIDTH = 1920;
  const V_HEIGHT = 1080;
  const GROUND_Y = 870; // Road asphalt line
  const SIDEWALK_Y = 820; // Sidewalk top line

  // Game internal state refs (mutable across animation frames)
  const stateRef = useRef({
    actors: [] as StudentActor[],
    clouds: [
      { x: 120, y: 90, scale: 1.1, speed: 0.15 },
      { x: 650, y: 140, scale: 0.85, speed: 0.2 },
      { x: 1150, y: 80, scale: 1.25, speed: 0.12 },
      { x: 1650, y: 130, scale: 0.95, speed: 0.18 },
    ],
    particles: [] as { x: number; y: number; vy: number; vx: number; alpha: number; size: number }[],
    // UFO state
    ufo: {
      x: V_WIDTH / 2,
      y: -240,
      targetX: V_WIDTH / 2,
      targetY: 230,
      vx: 0,
      vy: 0,
      tilt: 0,
      wobbleTimer: 0,
      beamActive: false,
      beamAlpha: 0,
      ledPhase: 0,
      counter: 0,
      totalToCatch: 2,
    },
    // Cinematic Sequencer (Mass lift all students -> suspense hold -> snatch 1 & 2 -> mass drop)
    cinematic: {
      phase: 'IDLE' as 'IDLE' | 'WARNING' | 'UFO_ENTER' | 'MASS_LIFT' | 'SUSPENSE_HOLD' | 'SNATCH' | 'MASS_DROP' | 'UFO_EXIT',
      timer: 0,
      suspenseScanX: V_WIDTH / 2,
      suspenseScanDir: 1,
      lastPulseTime: 0,
      lastTickTime: 0,
      snatchIndex: 0,
      snatchStage: 'LOCK' as 'LOCK' | 'SUCK' | 'PAUSE',
      snatchTimer: 0,
      snatchProgress: 0,
      isFinished: false,
    },
    selectedTargets: [] as StudentActor[],
    currentTargetIndex: 0,
    nightDarkness: 0, // 0 = day, 1 = night
    phaseTimer: 0,
    lastTime: performance.now(),
    running: true,
  });

  // Re-initialize student actors when student list changes
  const initActors = useCallback(() => {
    const actors: StudentActor[] = students.map((std, idx) => {
      // Spread students evenly along the sidewalk & crosswalk
      const spacing = (V_WIDTH - 240) / Math.max(1, students.length);
      const startX = 140 + idx * spacing + (Math.random() * 20 - 10);
      
      // Depth variations: students walking either near sidewalk or road edge
      const yOffset = (idx % 4) * 12 + Math.random() * 8;
      const baseY = SIDEWALK_Y + 15 + yOffset;
      const scale = 0.95 + (yOffset / 50) * 0.15; // subtle depth perspective

      // Assign wild unique tilt angles for when suspended in anti-gravity (ngả nghiêng, lộn nhào, chổng vó)
      const tiltAngles = [0.75, -0.85, 1.35, -1.45, 3.14, -2.85, 0.45, -0.55, 1.85, -1.95];
      const floatAngle = tiltAngles[idx % tiltAngles.length];

      // Calculate suspended mid-air cluster coordinates beneath the UFO (UFO center x=960, y=230)
      const angleOffset = (idx / Math.max(1, students.length)) * Math.PI * 2;
      const clusterRadiusX = 100 + ((idx * 47) % 220);
      const clusterTargetX = 960 + Math.sin(angleOffset) * clusterRadiusX + (Math.random() - 0.5) * 40;
      const clusterTargetY = 530 + Math.cos(angleOffset) * 110 + (Math.random() - 0.5) * 40;

      return {
        ...std,
        // Sport uniform: Áo thể thao vàng ngắn tay, cổ bẻ đỏ đô, quần đỏ đô
        shirtColor: '#facc15',
        pantsColor: '#881337',
        collarColor: '#881337',
        x: startX,
        y: baseY,
        baseX: startX,
        baseY,
        vx: (Math.random() > 0.5 ? 1 : -1) * (0.6 + Math.random() * 0.7),
        vy: 0,
        scale,
        facing: Math.random() > 0.5 ? 1 : -1,
        action: 'WALK',
        animTimer: Math.random() * 10,
        animFrame: Math.floor(Math.random() * 60),
        speechText: null,
        speechTimer: 0,
        alertMark: false,
        rotation: 0,
        isCaptured: false,
        targetLiftProgress: 0,
        floatAngle,
        isBystanderFloated: false,
        floatHeight: 0,
        clusterTargetX,
        clusterTargetY,
      };
    });

    stateRef.current.actors = actors;
  }, [students]);

  useEffect(() => {
    initActors();
  }, [initActors]);

  // Handle Game Phase Transitions
  useEffect(() => {
    const s = stateRef.current;
    s.phaseTimer = 0;

    if (gamePhase === 'IDLE') {
      sound.stopBGM();
      sound.stopUFOHover();
      sound.stopBeamSound();
      s.ufo.y = -260;
      s.ufo.beamActive = false;
      s.ufo.beamAlpha = 0;
      s.ufo.counter = 0;
      s.nightDarkness = 0;
      s.selectedTargets = [];
      s.currentTargetIndex = 0;
      s.cinematic.phase = 'IDLE';
      s.cinematic.timer = 0;

      // Reset actors to normal walking
      s.actors.forEach((actor) => {
        actor.action = 'WALK';
        actor.isCaptured = false;
        actor.alertMark = false;
        actor.rotation = 0;
        actor.y = actor.baseY;
        actor.targetLiftProgress = 0;
        actor.speechText = null;
      });
    }

    if (gamePhase === 'WARNING') {
      sound.playWarning();
      // Show exclamation marks on several students
      s.actors.forEach((actor) => {
        if (Math.random() < 0.65) {
          actor.alertMark = true;
          actor.action = 'ALERT';
          actor.vx = 0;
        }
      });
      // A couple of students speak warning lines
      const startled = s.actors.filter((a) => a.alertMark);
      if (startled.length > 0) {
        const speaker = startled[Math.floor(Math.random() * startled.length)];
        speaker.speechText = FUNNY_SPEECHES.warning[Math.floor(Math.random() * FUNNY_SPEECHES.warning.length)];
        speaker.speechTimer = 2.5;
      }
    }

    if (gamePhase === 'UFO_ENTER') {
      sound.startBGM(); // Start EDM suspense background music
      sound.startUFOHover();
      sound.playWhoosh();
      s.ufo.x = V_WIDTH * 0.75;
      s.ufo.y = -220;
      s.ufo.targetX = V_WIDTH * 0.5;
      s.ufo.targetY = 220;
      s.ufo.counter = 0;
      s.ufo.totalToCatch = settings.pickCount;
      s.cinematic.phase = 'UFO_ENTER';
      s.cinematic.timer = 0;

      // Pick random targets fairly using Fisher-Yates
      const availableActors = s.actors.filter((a) => !a.isCaptured);
      const shuffled = [...availableActors].sort(() => Math.random() - 0.5);
      const chosen = shuffled.slice(0, Math.min(settings.pickCount, shuffled.length));
      s.selectedTargets = chosen;
      s.currentTargetIndex = 0;
    }

    if (gamePhase === 'CHASE') {
      // In case App.tsx triggers CHASE, sync to cinematic flow
      if (s.cinematic.phase === 'IDLE' || s.cinematic.phase === 'WARNING') {
        sound.startBGM();
        s.cinematic.phase = 'UFO_ENTER';
        s.cinematic.timer = 0;
      }
    }

    if (gamePhase === 'UFO_EXIT') {
      sound.stopBGM();
      sound.stopBeamSound();
      sound.playWhoosh();
      s.ufo.beamActive = false;
      s.ufo.targetY = -350;
      s.ufo.targetX = V_WIDTH + 400;

      // Survivors cheer / breathe relief
      s.actors.forEach((actor) => {
        if (!actor.isCaptured) {
          actor.action = 'RELIEVED';
          actor.vx = 0;
          actor.y = actor.baseY;
          actor.rotation = 0;
        }
      });
      const luckySurvivor = s.actors.find((a) => !a.isCaptured);
      if (luckySurvivor) {
        luckySurvivor.speechText = FUNNY_SPEECHES.relief[Math.floor(Math.random() * FUNNY_SPEECHES.relief.length)];
        luckySurvivor.speechTimer = 3;
      }
    }
  }, [gamePhase, settings.pickCount]);

  // Main Render & Animation Loop
  useEffect(() => {
    let animationFrameId: number;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Speed multiplier from settings
    const speedMult = settings.speed === 'fast' ? 1.4 : settings.speed === 'slow' ? 0.75 : 1.0;

    const render = (now: number) => {
      const dt = Math.min((now - stateRef.current.lastTime) / 1000, 0.05) * speedMult;
      stateRef.current.lastTime = now;
      const s = stateRef.current;
      s.phaseTimer += dt;

      // 1. UPDATE LOGIC
      // --- Day/Night Transition ---
      if (gamePhase === 'WARNING' || gamePhase === 'UFO_ENTER' || gamePhase === 'CHASE' || gamePhase === 'BEAM_DOWN' || gamePhase === 'LIFTING' || gamePhase === 'SUCKED') {
        s.nightDarkness = Math.min(1, s.nightDarkness + dt * 0.9);
      } else if (gamePhase === 'UFO_EXIT' || gamePhase === 'RESULTS' || gamePhase === 'IDLE') {
        s.nightDarkness = Math.max(0, s.nightDarkness - dt * 0.7);
      }

      // --- Clouds Drift ---
      s.clouds.forEach((cloud) => {
        cloud.x -= cloud.speed * dt * 60;
        if (cloud.x < -200) {
          cloud.x = V_WIDTH + 150;
          cloud.y = 60 + Math.random() * 100;
        }
      });

      // --- UFO Physics & State Machine ---
      s.ufo.wobbleTimer += dt * 3.5;
      s.ufo.ledPhase += dt * 6;

      // Move UFO toward target pos
      const dx = s.ufo.targetX - s.ufo.x;
      const dy = s.ufo.targetY - s.ufo.y;
      s.ufo.x += dx * Math.min(1, dt * 3.2);
      s.ufo.y += dy * Math.min(1, dt * 3.2);

      // Natural tilt based on horizontal velocity
      const targetTilt = Math.max(-0.25, Math.min(0.25, dx * 0.0012));
      s.ufo.tilt += (targetTilt - s.ufo.tilt) * Math.min(1, dt * 5);

      // Beam alpha transition
      if (s.ufo.beamActive) {
        s.ufo.beamAlpha = Math.min(1, s.ufo.beamAlpha + dt * 4);
      } else {
        s.ufo.beamAlpha = Math.max(0, s.ufo.beamAlpha - dt * 5);
      }

      // Particles inside beam
      if (s.ufo.beamAlpha > 0.1) {
        if (Math.random() < 0.4) {
          const angle = (Math.random() - 0.5) * 0.4;
          const beamWidthAtBottom = 340;
          const px = s.ufo.x + (Math.random() - 0.5) * beamWidthAtBottom;
          s.particles.push({
            x: px,
            y: GROUND_Y - Math.random() * 40,
            vy: -(120 + Math.random() * 220),
            vx: (s.ufo.x - px) * 0.35,
            alpha: 1,
            size: 3 + Math.random() * 4,
          });
        }
      }
      // Update particles
      for (let i = s.particles.length - 1; i >= 0; i--) {
        const p = s.particles[i];
        p.y += p.vy * dt;
        p.x += p.vx * dt;
        p.alpha -= dt * 0.9;
        if (p.alpha <= 0 || p.y < s.ufo.y + 60) {
          s.particles.splice(i, 1);
        }
      }

      // --- Suspenseful Cinematic Abduction Sequencer ---
      // Flow: UFO_ENTER -> MASS_LIFT (all students lift) -> SUSPENSE_HOLD (hovering suspended for suspense) -> SNATCH (pick target 1, then target 2) -> MASS_DROP (survivors drop back down) -> UFO_EXIT
      const cine = s.cinematic;

      if (cine.phase === 'UFO_ENTER') {
        cine.timer += dt;
        s.ufo.targetX = V_WIDTH * 0.5;
        s.ufo.targetY = 220;

        // When UFO reaches near position (approx 1.2s), trigger MASS_LIFT!
        if (cine.timer >= 1.2 || Math.abs(s.ufo.y - 220) < 55) {
          cine.phase = 'MASS_LIFT';
          cine.timer = 0;
          s.ufo.beamActive = true;
          sound.playMassLevitation();
          sound.playSlideWhistle(true);
          sound.startBeamSound();

          // Shock quotes
          const funnyStart = [
            'Ủa tiếng gì hút mạnh dữ vậy?!',
            'Cứu tui chổng vó rồi bà con ơi!!',
            'Á á sao ai cũng bay lên hết dị?!',
            'Trời ơi đĩa bay kéo cả lớp lên rồi!!',
          ];
          s.actors.forEach((act) => {
            act.action = 'BEING_LIFTED';
            act.isBystanderFloated = true;
          });
          const speaker = s.actors[Math.floor(Math.random() * s.actors.length)];
          if (speaker) {
            speaker.speechText = funnyStart[Math.floor(Math.random() * funnyStart.length)];
            speaker.speechTimer = 2.8;
          }
        }
      } else if (cine.phase === 'MASS_LIFT') {
        cine.timer += dt;
        s.ufo.beamActive = true;

        // Everyone floats up over ~1.8 seconds
        const liftProgress = Math.min(1, cine.timer / 1.6);
        s.actors.forEach((actor, idx) => {
          if (!actor.isCaptured) {
            actor.action = 'BEING_LIFTED';
            actor.isBystanderFloated = true;
            // Height distributed nicely between 130 and 260px
            const targetFloatH = 130 + ((idx * 37) % 130);
            actor.floatHeight = targetFloatH * liftProgress;
            actor.y = actor.baseY - actor.floatHeight;
            // Rotate smoothly towards wild floatAngle
            actor.rotation = actor.floatAngle * liftProgress;
          }
        });

        // After lifting completes, enter SUSPENSE_HOLD
        if (cine.timer >= 1.8) {
          cine.phase = 'SUSPENSE_HOLD';
          cine.timer = 0;
          cine.lastPulseTime = 0;
          cine.lastTickTime = 0;
          cine.suspenseScanX = V_WIDTH * 0.5;
          cine.suspenseScanDir = 1;
        }
      } else if (cine.phase === 'SUSPENSE_HOLD') {
        cine.timer += dt;
        s.ufo.beamActive = true;

        // ALL STUDENTS FLOAT SUSPENDED IN MID-AIR!
        // Gentle anti-gravity bobbing & wobble
        s.actors.forEach((actor, idx) => {
          if (!actor.isCaptured) {
            actor.action = 'BEING_LIFTED';
            actor.isBystanderFloated = true;
            actor.y = actor.baseY - actor.floatHeight + Math.sin(s.phaseTimer * 4 + idx) * 8;
            actor.rotation = actor.floatAngle + Math.sin(s.phaseTimer * 5 + idx * 0.7) * 0.15;
          }
        });

        // Suspense scanner sweeps back and forth across all students!
        cine.suspenseScanX += cine.suspenseScanDir * dt * 750;
        if (cine.suspenseScanX > V_WIDTH - 240) {
          cine.suspenseScanX = V_WIDTH - 240;
          cine.suspenseScanDir = -1;
        } else if (cine.suspenseScanX < 240) {
          cine.suspenseScanX = 240;
          cine.suspenseScanDir = 1;
        }

        // Tense heartbeat / sonar pulses
        cine.lastPulseTime += dt;
        if (cine.lastPulseTime >= 0.55) {
          cine.lastPulseTime = 0;
          sound.playSuspensePulse(400 + Math.random() * 120);
        }

        // Clock ticking rhythm (from Audio 1)
        cine.lastTickTime += dt;
        if (cine.lastTickTime >= 0.22) {
          cine.lastTickTime = 0;
          sound.playCartoonTick(750 + Math.random() * 300);
        }

        // Funny floating quotes
        if (Math.random() < 0.02) {
          const floatingQuotes = [
            'Hồi hộp quá, ai sẽ bị tóm đây?!',
            'Đừng chọn em mà!!',
            'Sao Hỏa lạnh lắm tha cho em đi!',
            'Thầy ơi em chưa học bài!!',
            'Tim đập thình thịch luôn á trời!',
            'Cứu em má ơi!!',
            'Ai cũng lơ lửng hết nè!!',
          ];
          const cand = s.actors.filter((a) => !a.isCaptured && !a.speechText);
          if (cand.length > 0) {
            const spk = cand[Math.floor(Math.random() * cand.length)];
            spk.speechText = floatingQuotes[Math.floor(Math.random() * floatingQuotes.length)];
            spk.speechTimer = 2.4;
          }
        }

        // Suspense hold for ~3.5 seconds, then start SNATCHING!
        if (cine.timer >= 3.5) {
          cine.phase = 'SNATCH';
          cine.snatchIndex = 0;
          cine.snatchStage = 'LOCK';
          cine.snatchTimer = 0;
          cine.snatchProgress = 0;
        }
      } else if (cine.phase === 'SNATCH') {
        cine.snatchTimer += dt;
        s.ufo.beamActive = true;

        // Keep all uncaptured students floating suspended
        s.actors.forEach((actor, idx) => {
          if (!actor.isCaptured && actor !== s.selectedTargets[cine.snatchIndex]) {
            actor.action = 'BEING_LIFTED';
            actor.isBystanderFloated = true;
            actor.y = actor.baseY - actor.floatHeight + Math.sin(s.phaseTimer * 4 + idx) * 8;
            actor.rotation = actor.floatAngle + Math.sin(s.phaseTimer * 5 + idx * 0.7) * 0.15;
          }
        });

        const currentTarget = s.selectedTargets[cine.snatchIndex];
        if (!currentTarget) {
          // All snatched, trigger drop!
          cine.phase = 'MASS_DROP';
          cine.timer = 0;
          s.ufo.beamActive = false;
          sound.stopBeamSound();
          sound.playSlideWhistle(false);
        } else {
          if (cine.snatchStage === 'LOCK') {
            // Scanner locks onto target.x
            cine.suspenseScanX += (currentTarget.x - cine.suspenseScanX) * Math.min(1, dt * 14);
            currentTarget.alertMark = true;

            if (cine.snatchTimer >= 0.7) {
              currentTarget.speechText = cine.snatchIndex === 0
                ? 'Sao lại là em?! Thầy ơi!!'
                : 'Em biết ngay mà! Tha cho em!!';
              currentTarget.speechTimer = 2.5;
              sound.playLiftSound();
              sound.playSlideWhistle(true);
              cine.snatchStage = 'SUCK';
              cine.snatchTimer = 0;
              cine.snatchProgress = 0;
            }
          } else if (cine.snatchStage === 'SUCK') {
            // Target sucked into UFO hatch!
            cine.snatchProgress += dt * 1.6;
            const prog = Math.min(1, cine.snatchProgress);
            const startX = currentTarget.x;
            currentTarget.x = startX + (s.ufo.x - startX) * prog * 0.6;
            const startY = currentTarget.baseY - currentTarget.floatHeight;
            const destY = s.ufo.y + 70;
            currentTarget.y = startY + (destY - startY) * prog;
            currentTarget.rotation += dt * 18; // rapid spin

            if (prog >= 1) {
              currentTarget.isCaptured = true;
              currentTarget.action = 'CAPTURED';
              s.ufo.counter += 1;
              sound.playSuctionPop();
              onCaptureOne(currentTarget, s.ufo.counter);

              cine.snatchStage = 'PAUSE';
              cine.snatchTimer = 0;
            }
          } else if (cine.snatchStage === 'PAUSE') {
            if (cine.snatchTimer >= 0.8) {
              cine.snatchIndex += 1;
              if (cine.snatchIndex < s.selectedTargets.length) {
                cine.snatchStage = 'LOCK';
                cine.snatchTimer = 0;
              } else {
                // Done capturing all targets! Turn beam off and trigger MASS_DROP!
                cine.phase = 'MASS_DROP';
                cine.timer = 0;
                s.ufo.beamActive = false;
                sound.stopBeamSound();
                sound.playSlideWhistle(false);
              }
            }
          }
        }
      } else if (cine.phase === 'MASS_DROP') {
        cine.timer += dt;
        s.ufo.beamActive = false;

        // Anti-gravity shuts off! All surviving students fall back to ground!
        let anyFalling = false;
        s.actors.forEach((actor) => {
          if (!actor.isCaptured) {
            if (actor.y < actor.baseY) {
              anyFalling = true;
              actor.vy = (actor.vy || 0) + 1600 * dt;
              actor.y += actor.vy * dt;
              actor.rotation += (0 - actor.rotation) * Math.min(1, dt * 10);

              if (actor.y >= actor.baseY) {
                actor.y = actor.baseY;
                actor.vy = 0;
                actor.rotation = 0;
                actor.action = 'TRIP';
                actor.isBystanderFloated = false;
                actor.floatHeight = 0;
                sound.playDropThud();

                const dropRelief = [
                  'Bịch! May quá rớt lại xuống đất!',
                  'Hú hồn chim én, thoát rồi!!',
                  'Bình an vô sự rồi bay ơi!!',
                  'May ghê chưa bị bốc lên sao Hỏa!',
                ];
                actor.speechText = dropRelief[Math.floor(Math.random() * dropRelief.length)];
                actor.speechTimer = 3.0;
              }
            }
          }
        });

        // Once dropped and held for 1.4s, UFO exits!
        if (!anyFalling && cine.timer >= 1.4) {
          cine.phase = 'UFO_EXIT';
          cine.timer = 0;
          sound.stopBGM();
          sound.playWhoosh();
          s.ufo.targetY = -380;
          s.ufo.targetX = V_WIDTH + 500;
          onSequenceComplete(s.selectedTargets);
        }
      }

      // --- Students Motion Update ---
      s.actors.forEach((actor) => {
        actor.animTimer += dt;
        actor.animFrame += dt * 60;

        // Speech bubble timer
        if (actor.speechTimer > 0) {
          actor.speechTimer -= dt;
          if (actor.speechTimer <= 0) {
            actor.speechText = null;
          }
        }

        if (actor.action === 'WALK') {
          actor.x += actor.vx * dt * 45;
          // Reverse direction at edges
          if (actor.x < 110) {
            actor.x = 110;
            actor.vx = Math.abs(actor.vx);
            actor.facing = 1;
          } else if (actor.x > V_WIDTH - 110) {
            actor.x = V_WIDTH - 110;
            actor.vx = -Math.abs(actor.vx);
            actor.facing = -1;
          }

          // Random idle pauses or speech
          if (Math.random() < 0.002 && actor.speechText === null && settings.showSpeech) {
            actor.speechText = FUNNY_SPEECHES.idle[Math.floor(Math.random() * FUNNY_SPEECHES.idle.length)];
            actor.speechTimer = 2.5;
          }
        } else if (actor.action === 'PANIC_RUN') {
          actor.x += actor.vx * dt * 65;
          if (actor.x < 120 || actor.x > V_WIDTH - 120) {
            actor.vx *= -1;
            actor.facing = actor.vx > 0 ? 1 : -1;
          }
        } else if (actor.action === 'LEAP') {
          actor.x += actor.vx * dt * 45;
          actor.y += actor.vy * dt * 50;
          actor.vy += 16 * dt * 50; // gravity
          if (actor.y >= actor.baseY) {
            actor.y = actor.baseY;
            actor.vy = 0;
            actor.action = 'PANIC_RUN';
          }
        } else if (actor.action === 'TRIP') {
          // Fallen on ground, get back up after 1.5s
          if (actor.animTimer > 1.5) {
            actor.action = 'PANIC_RUN';
            actor.vx = (Math.random() > 0.5 ? 1 : -1) * 3;
            actor.facing = actor.vx > 0 ? 1 : -1;
          }
        }
      });

      // 2. RENDER SCENE
      ctx.clearRect(0, 0, V_WIDTH, V_HEIGHT);

      // Layer 1: Sky with smooth Day/Night gradient
      drawSky(ctx, V_WIDTH, V_HEIGHT, s.nightDarkness);

      // Layer 2: Clouds
      drawClouds(ctx, s.clouds, s.nightDarkness);

      // Layer 3: Distant silhouettes
      drawDistantCity(ctx, V_WIDTH, s.nightDarkness);

      // Layer 4: Main Row of Vietnamese Urban Shophouses & Storefront Signs
      drawVietnameseCity(ctx, V_WIDTH, s.nightDarkness);

      // Layer 5: Street Lamps (with Night Glow) & Overhead Power Lines
      drawPowerLinesAndLamps(ctx, V_WIDTH, s.nightDarkness);

      // Layer 6: Sidewalk & Road with Zebra Crossing
      drawRoadAndSidewalk(ctx, V_WIDTH, GROUND_Y, SIDEWALK_Y, s.nightDarkness);

      // Layer 7: Parked vehicles (delivery cart, taxi, scooters)
      drawVehicles(ctx, s.nightDarkness);

      // Layer 8: Tractor Beam (drawn behind or around actors)
      if (s.ufo.beamAlpha > 0.01) {
        drawTractorBeam(ctx, s.ufo.x, s.ufo.y + 70, GROUND_Y, s.ufo.beamAlpha, s.particles);
      }

      // Layer 8b: Suspense Targeting Scanner Beam & Lock-on Reticle
      if ((s.cinematic.phase === 'SUSPENSE_HOLD' || s.cinematic.phase === 'SNATCH') && s.ufo.beamAlpha > 0.1) {
        const isLocked = s.cinematic.phase === 'SNATCH' && (s.cinematic.snatchStage === 'LOCK' || s.cinematic.snatchStage === 'SUCK');
        drawSuspenseScanner(ctx, s.ufo.x, s.ufo.y + 70, s.cinematic.suspenseScanX, GROUND_Y, isLocked);
      }

      // Layer 9: Students & Labels
      // Sort students by baseY for proper vertical depth layering
      const sortedActors = [...s.actors].sort((a, b) => a.y - b.y);
      sortedActors.forEach((actor) => {
        if (!actor.isCaptured) {
          drawStudent(ctx, actor, settings.showLabels);
        }
      });

      // Layer 10: Speech Bubbles
      if (settings.showSpeech) {
        s.actors.forEach((actor) => {
          if (!actor.isCaptured && actor.speechText) {
            drawSpeechBubble(ctx, actor.x, actor.y - 120 * actor.scale, actor.speechText);
          }
        });
      }

      // Layer 11: UFO Saucer & Alien Cockpit
      drawUFO(ctx, s.ufo.x, s.ufo.y, s.ufo.tilt, s.ufo.ledPhase, s.ufo.counter, s.ufo.totalToCatch);

      // Layer 12: Night Ambience Vignette
      if (s.nightDarkness > 0) {
        ctx.fillStyle = `rgba(10, 10, 30, ${s.nightDarkness * 0.3})`;
        ctx.fillRect(0, 0, V_WIDTH, V_HEIGHT);
      }

      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animationFrameId);
  }, [gamePhase, settings.speed, settings.showLabels, settings.showSpeech, onCaptureOne, onSequenceComplete]);

  /* =========================================================================
     DRAWING HELPERS: 2D VECTOR CARTOON ASSETS
     ========================================================================= */

  // Sky background (smooth gradient transition from day to evening/night)
  const drawSky = (ctx: CanvasRenderingContext2D, w: number, h: number, night: number) => {
    const grad = ctx.createLinearGradient(0, 0, 0, h * 0.7);
    // Day: bright soft sky blue (#6cbbf7 to #d9f0fc)
    // Night: deep mystery indigo/purple (#12112d to #252857)
    const topR = Math.round(108 + (18 - 108) * night);
    const topG = Math.round(187 + (17 - 187) * night);
    const topB = Math.round(247 + (45 - 247) * night);

    const botR = Math.round(217 + (37 - 217) * night);
    const botG = Math.round(240 + (40 - 240) * night);
    const botB = Math.round(252 + (87 - 252) * night);

    grad.addColorStop(0, `rgb(${topR}, ${topG}, ${topB})`);
    grad.addColorStop(1, `rgb(${botR}, ${botG}, ${botB})`);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);
  };

  // Fluffy cartoon clouds
  const drawClouds = (ctx: CanvasRenderingContext2D, clouds: { x: number; y: number; scale: number }[], night: number) => {
    ctx.save();
    clouds.forEach((c) => {
      ctx.fillStyle = night > 0.5 ? `rgba(200, 210, 240, ${0.4 - night * 0.2})` : 'rgba(255, 255, 255, 0.85)';
      ctx.beginPath();
      const r = 40 * c.scale;
      ctx.arc(c.x, c.y, r, 0, Math.PI * 2);
      ctx.arc(c.x + 35 * c.scale, c.y - 12 * c.scale, r * 0.85, 0, Math.PI * 2);
      ctx.arc(c.x + 70 * c.scale, c.y + 4 * c.scale, r * 0.9, 0, Math.PI * 2);
      ctx.arc(c.x + 35 * c.scale, c.y + 15 * c.scale, r * 0.75, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.restore();
  };

  // Distant city silhouette
  const drawDistantCity = (ctx: CanvasRenderingContext2D, w: number, night: number) => {
    ctx.save();
    ctx.fillStyle = night > 0.5 ? '#1a1f3c' : '#b2daf2';
    // Distant building blocks
    const bldgs = [
      { x: 0, w: 180, h: 260 },
      { x: 190, w: 140, h: 320 },
      { x: 340, w: 200, h: 240 },
      { x: 550, w: 160, h: 350 },
      { x: 720, w: 220, h: 280 },
      { x: 950, w: 170, h: 380 },
      { x: 1130, w: 190, h: 300 },
      { x: 1330, w: 210, h: 340 },
      { x: 1550, w: 180, h: 260 },
      { x: 1740, w: 200, h: 330 },
    ];
    bldgs.forEach((b) => {
      ctx.fillRect(b.x, SIDEWALK_Y - b.h, b.w, b.h);
    });
    ctx.restore();
  };

  // Main Vietnamese City Shophouses with exact storefront signboards from video
  const drawVietnameseCity = (ctx: CanvasRenderingContext2D, w: number, night: number) => {
    ctx.save();

    // List of authentic buildings matching the video layout:
    // [XE BUÝT] [NHÀ SÁCH] [CƠM TẤM] [BÁNH MÌ] [TREE] [TRÀ SỮA] [HỚT TÓC] [BÚN CHẢ] [KEM] [ĐIỆN THOẠI]
    const shophouses = [
      {
        x: 30,
        w: 170,
        h: 380,
        color: '#f8fafc',
        sign: 'XE BUÝT',
        signBg: '#0284c7',
        signColor: '#ffffff',
        floors: 1,
        isBusStop: true,
      },
      {
        x: 210,
        w: 190,
        h: 460,
        color: '#fef3c7', // warm beige
        sign: 'NHÀ SÁCH',
        signBg: '#15803d', // green
        signColor: '#ffffff',
        floors: 3,
      },
      {
        x: 410,
        w: 180,
        h: 420,
        color: '#fed7aa', // pastel orange
        sign: 'CƠM TẤM',
        signBg: '#ea580c', // orange red
        signColor: '#ffffff',
        floors: 3,
      },
      {
        x: 600,
        w: 190,
        h: 440,
        color: '#fef08a', // light yellow
        sign: 'BÁNH MÌ',
        signBg: '#eab308', // gold yellow
        signColor: '#78350f',
        floors: 3,
      },
      {
        x: 800,
        w: 140,
        h: 400,
        color: '#dcfce7',
        isTreeGap: true,
        floors: 2,
      },
      {
        x: 950,
        w: 190,
        h: 450,
        color: '#ccfbf1', // soft teal
        sign: 'TRÀ SỮA',
        signBg: '#059669', // emerald
        signColor: '#ffffff',
        floors: 3,
      },
      {
        x: 1150,
        w: 180,
        h: 460,
        color: '#e2e8f0', // soft slate
        sign: 'HỚT TÓC',
        signBg: '#0f172a', // dark navy
        signColor: '#f8fafc',
        floors: 3,
      },
      {
        x: 1340,
        w: 190,
        h: 430,
        color: '#ecfccb', // lime cream
        sign: 'BÚN CHẢ',
        signBg: '#65a30d', // lime green
        signColor: '#ffffff',
        floors: 3,
      },
      {
        x: 1540,
        w: 180,
        h: 450,
        color: '#fce7f3', // soft pink
        sign: 'KEM',
        signBg: '#db2777', // pink
        signColor: '#ffffff',
        floors: 3,
      },
      {
        x: 1730,
        w: 180,
        h: 420,
        color: '#e0f2fe', // sky blue
        sign: 'ĐIỆN THOẠI',
        signBg: '#0284c7', // cyan
        signColor: '#ffffff',
        floors: 3,
      },
    ];

    shophouses.forEach((sh) => {
      const topY = SIDEWALK_Y - sh.h;

      if (sh.isBusStop) {
        // Modern Bus Stop Shelter
        ctx.fillStyle = '#0284c7';
        ctx.fillRect(sh.x, SIDEWALK_Y - 240, sh.w, 14); // roof
        ctx.fillStyle = '#334155';
        ctx.fillRect(sh.x + 20, SIDEWALK_Y - 226, 8, 226); // pillar
        ctx.fillRect(sh.x + sh.w - 28, SIDEWALK_Y - 226, 8, 226);
        // Glass back panel
        ctx.fillStyle = night > 0.5 ? 'rgba(50, 70, 110, 0.4)' : 'rgba(224, 242, 254, 0.7)';
        ctx.fillRect(sh.x + 28, SIDEWALK_Y - 220, sh.w - 56, 170);
        // Bus stop sign
        ctx.fillStyle = '#0284c7';
        roundRect(ctx, sh.x + 35, SIDEWALK_Y - 210, sh.w - 70, 42, 6);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 20px "Be Vietnam Pro", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('XE BUÝT', sh.x + sh.w / 2, SIDEWALK_Y - 182);

        // Bench
        ctx.fillStyle = '#b45309';
        ctx.fillRect(sh.x + 40, SIDEWALK_Y - 70, sh.w - 80, 12);
        ctx.fillStyle = '#475569';
        ctx.fillRect(sh.x + 45, SIDEWALK_Y - 58, 6, 58);
        ctx.fillRect(sh.x + sh.w - 51, SIDEWALK_Y - 58, 6, 58);
        return;
      }

      // Building wall
      ctx.fillStyle = sh.color;
      ctx.fillRect(sh.x, topY, sh.w, sh.h);

      // Roof parapet
      ctx.fillStyle = '#94a3b8';
      ctx.fillRect(sh.x - 4, topY - 12, sh.w + 8, 14);

      // Windows with Day/Night Lighting
      const floorH = (sh.h - 100) / sh.floors;
      for (let f = 0; f < sh.floors; f++) {
        const wy = topY + 25 + f * floorH;
        const winW = 42;
        const winH = 50;

        // Two windows per floor
        [sh.x + 25, sh.x + sh.w - 67].forEach((wx) => {
          // Window frame
          ctx.fillStyle = '#475569';
          ctx.fillRect(wx - 3, wy - 3, winW + 6, winH + 6);

          // Glass: Sky reflection in Day, Warm glowing Amber in Night
          if (night > 0.2) {
            ctx.fillStyle = `rgba(255, 214, 94, ${night * 0.95})`; // Glowing window
            ctx.fillRect(wx, wy, winW, winH);
            // Window glow spill
            ctx.fillStyle = `rgba(255, 225, 120, ${night * 0.35})`;
            ctx.fillRect(wx - 8, wy - 8, winW + 16, winH + 16);
          } else {
            ctx.fillStyle = '#bae6fd'; // daylight blue glass
            ctx.fillRect(wx, wy, winW, winH);
            // Glass reflection line
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(wx + 8, wy + winH - 6);
            ctx.lineTo(wx + winW - 8, wy + 6);
            ctx.stroke();
          }

          // Window cross bars
          ctx.strokeStyle = '#334155';
          ctx.lineWidth = 2;
          ctx.strokeRect(wx, wy, winW, winH);
        });
      }

      // Storefront Signboard (Pill/Rect with bold Vietnamese typography)
      if (sh.sign) {
        const signY = SIDEWALK_Y - 110;
        ctx.fillStyle = sh.signBg;
        roundRect(ctx, sh.x + 10, signY, sh.w - 20, 52, 8);
        ctx.fill();

        // Sign border
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2.5;
        ctx.stroke();

        // Text
        ctx.fillStyle = sh.signColor;
        ctx.font = 'bold 22px "Be Vietnam Pro", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(sh.sign, sh.x + sh.w / 2, signY + 26);

        // Store entrance door below sign
        ctx.fillStyle = night > 0.5 ? '#1e293b' : '#334155';
        ctx.fillRect(sh.x + 30, SIDEWALK_Y - 50, sh.w - 60, 50);
      }
    });

    // Big round green tree in the middle gap (at x=870)
    drawTree(ctx, 870, SIDEWALK_Y);

    ctx.restore();
  };

  // Stylized Vietnamese street tree
  const drawTree = (ctx: CanvasRenderingContext2D, x: number, y: number) => {
    // Trunk
    ctx.fillStyle = '#78350f';
    ctx.fillRect(x - 12, y - 180, 24, 180);
    // Tree crown (lush layered greens)
    ctx.fillStyle = '#15803d';
    ctx.beginPath();
    ctx.arc(x, y - 240, 75, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#22c55e';
    ctx.beginPath();
    ctx.arc(x - 25, y - 250, 50, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#16a34a';
    ctx.beginPath();
    ctx.arc(x + 25, y - 235, 55, 0, Math.PI * 2);
    ctx.fill();
  };

  // Overhead power lines & street lamps
  const drawPowerLinesAndLamps = (ctx: CanvasRenderingContext2D, w: number, night: number) => {
    ctx.save();

    // Power lines (dây điện đô thị)
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1.8;
    for (let i = 0; i < 3; i++) {
      const startY = 320 + i * 22;
      ctx.beginPath();
      ctx.moveTo(0, startY);
      ctx.bezierCurveTo(w * 0.33, startY + 25, w * 0.66, startY + 25, w, startY);
      ctx.stroke();
    }

    // Street Lamps with warm glowing cones at night
    const lampXList = [180, 560, 920, 1300, 1680];
    lampXList.forEach((lx) => {
      // Lamp pole
      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.moveTo(lx, SIDEWALK_Y);
      ctx.lineTo(lx, SIDEWALK_Y - 260);
      ctx.bezierCurveTo(lx, SIDEWALK_Y - 290, lx + 25, SIDEWALK_Y - 300, lx + 45, SIDEWALK_Y - 295);
      ctx.stroke();

      // Lamp head
      ctx.fillStyle = '#334155';
      ctx.fillRect(lx + 35, SIDEWALK_Y - 295, 20, 10);

      // Night Lamp Glow
      if (night > 0.1) {
        // Glowing bulb
        ctx.fillStyle = `rgba(254, 240, 138, ${night})`;
        ctx.beginPath();
        ctx.arc(lx + 45, SIDEWALK_Y - 285, 7, 0, Math.PI * 2);
        ctx.fill();

        // Light cone washing down to the ground
        const lightGrad = ctx.createLinearGradient(lx + 45, SIDEWALK_Y - 285, lx + 45, GROUND_Y);
        lightGrad.addColorStop(0, `rgba(254, 240, 138, ${night * 0.45})`);
        lightGrad.addColorStop(1, 'rgba(254, 240, 138, 0)');
        ctx.fillStyle = lightGrad;
        ctx.beginPath();
        ctx.moveTo(lx + 45, SIDEWALK_Y - 285);
        ctx.lineTo(lx - 60, GROUND_Y);
        ctx.lineTo(lx + 150, GROUND_Y);
        ctx.closePath();
        ctx.fill();
      }
    });

    ctx.restore();
  };

  // Sidewalk & Asphalt Road with Zebra Crossing
  const drawRoadAndSidewalk = (ctx: CanvasRenderingContext2D, w: number, roadY: number, walkY: number, night: number) => {
    ctx.save();

    // Sidewalk (Vỉa hè)
    ctx.fillStyle = night > 0.5 ? '#64748b' : '#cbd5e1';
    ctx.fillRect(0, walkY, w, roadY - walkY);

    // Curb edge line
    ctx.fillStyle = '#475569';
    ctx.fillRect(0, roadY - 4, w, 4);

    // Road (Đường nhựa)
    ctx.fillStyle = night > 0.5 ? '#1e293b' : '#334155';
    ctx.fillRect(0, roadY, w, 1080 - roadY);

    // Zebra pedestrian crossing (Vạch kẻ đường cho người đi bộ)
    ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
    for (let zx = 650; zx < 850; zx += 35) {
      ctx.fillRect(zx, roadY + 8, 20, 80);
    }

    // Road dashed divider lines
    ctx.strokeStyle = '#f8fafc';
    ctx.lineWidth = 6;
    ctx.setLineDash([40, 30]);
    ctx.beginPath();
    ctx.moveTo(0, roadY + 110);
    ctx.lineTo(w, roadY + 110);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.restore();
  };

  // Vehicles (White taxi, red delivery cart, blue motorbikes)
  const drawVehicles = (ctx: CanvasRenderingContext2D, night: number) => {
    ctx.save();

    // 1. Red delivery pushcart / "Xe ba gác / xe đẩy hàng" at x=280
    const cx = 310;
    const cy = GROUND_Y + 45;
    ctx.fillStyle = '#ef4444'; // red cart frame
    ctx.fillRect(cx - 40, cy - 25, 80, 30);
    // Goods boxes on cart
    ctx.fillStyle = '#d97706';
    ctx.fillRect(cx - 30, cy - 48, 32, 24);
    ctx.fillStyle = '#ca8a04';
    ctx.fillRect(cx + 4, cy - 44, 28, 20);
    // Wheels
    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.arc(cx - 26, cy + 10, 14, 0, Math.PI * 2);
    ctx.arc(cx + 26, cy + 10, 14, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#cbd5e1';
    ctx.beginPath();
    ctx.arc(cx - 26, cy + 10, 5, 0, Math.PI * 2);
    ctx.arc(cx + 26, cy + 10, 5, 0, Math.PI * 2);
    ctx.fill();

    // 2. White taxi car at x=1420
    const tx = 1440;
    const ty = GROUND_Y + 50;
    // Car body
    ctx.fillStyle = '#f8fafc';
    roundRect(ctx, tx - 90, ty - 32, 180, 42, 8);
    ctx.fill();
    // Cabin roof
    roundRect(ctx, tx - 55, ty - 60, 110, 32, 8);
    ctx.fill();
    // Windows
    ctx.fillStyle = '#38bdf8';
    ctx.fillRect(tx - 48, ty - 54, 45, 22);
    ctx.fillRect(tx + 3, ty - 54, 45, 22);
    // Taxi roof sign
    ctx.fillStyle = '#eab308';
    roundRect(ctx, tx - 18, ty - 72, 36, 12, 3);
    ctx.fill();
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 8px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('TAXI', tx, ty - 63);
    // Wheels
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.arc(tx - 55, ty + 12, 16, 0, Math.PI * 2);
    ctx.arc(tx + 55, ty + 12, 16, 0, Math.PI * 2);
    ctx.fill();

    // 3. Blue motorbike / scooter at x=1120
    const mx = 1120;
    const my = GROUND_Y + 40;
    ctx.fillStyle = '#2563eb'; // blue scooter body
    ctx.fillRect(mx - 22, my - 18, 44, 20);
    // Seat
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(mx - 18, my - 24, 28, 8);
    // Handlebar
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(mx + 15, my - 16);
    ctx.lineTo(mx + 18, my - 34);
    ctx.stroke();
    // Wheels
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.arc(mx - 16, my + 6, 12, 0, Math.PI * 2);
    ctx.arc(mx + 16, my + 6, 12, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  };

  // Tractor Beam: Translucent glowing cyan cone covering the entire crowd
  const drawTractorBeam = (
    ctx: CanvasRenderingContext2D,
    bx: number,
    by: number,
    groundY: number,
    alpha: number,
    particles: { x: number; y: number; alpha: number; size: number }[]
  ) => {
    ctx.save();

    // Immense wide mega tractor beam covering all students across the street
    const beamTopW = 160;
    const beamBottomW = 1620;

    // Outer soft glow cone
    const grad = ctx.createLinearGradient(bx, by, bx, groundY);
    grad.addColorStop(0, `rgba(56, 189, 248, ${0.88 * alpha})`);
    grad.addColorStop(0.35, `rgba(45, 212, 191, ${0.55 * alpha})`);
    grad.addColorStop(0.7, `rgba(20, 184, 166, ${0.35 * alpha})`);
    grad.addColorStop(1, `rgba(20, 184, 166, ${0.18 * alpha})`);

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(bx - beamTopW / 2, by);
    ctx.lineTo(bx + beamTopW / 2, by);
    ctx.lineTo(bx + beamBottomW / 2, groundY);
    ctx.lineTo(bx - beamBottomW / 2, groundY);
    ctx.closePath();
    ctx.fill();

    // Inner bright core ray
    const coreGrad = ctx.createLinearGradient(bx, by, bx, groundY);
    coreGrad.addColorStop(0, `rgba(255, 255, 255, ${0.92 * alpha})`);
    coreGrad.addColorStop(0.4, `rgba(186, 230, 253, ${0.6 * alpha})`);
    coreGrad.addColorStop(1, `rgba(125, 211, 252, ${0.2 * alpha})`);

    ctx.fillStyle = coreGrad;
    ctx.beginPath();
    ctx.moveTo(bx - 50, by);
    ctx.lineTo(bx + 50, by);
    ctx.lineTo(bx + 320, groundY);
    ctx.lineTo(bx - 320, groundY);
    ctx.closePath();
    ctx.fill();

    // Ground illumination ellipse pool with soft ripple rings
    const groundPoolGrad = ctx.createRadialGradient(bx, groundY, 40, bx, groundY, beamBottomW / 2);
    groundPoolGrad.addColorStop(0, `rgba(103, 232, 249, ${0.85 * alpha})`);
    groundPoolGrad.addColorStop(0.5, `rgba(45, 212, 191, ${0.45 * alpha})`);
    groundPoolGrad.addColorStop(1, 'rgba(45, 212, 191, 0)');

    ctx.fillStyle = groundPoolGrad;
    ctx.beginPath();
    ctx.ellipse(bx, groundY, beamBottomW / 2, 50, 0, 0, Math.PI * 2);
    ctx.fill();

    // Outer ripple rings
    ctx.strokeStyle = `rgba(167, 243, 208, ${0.5 * alpha})`;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.ellipse(bx, groundY, beamBottomW / 2 * 0.85, 40, 0, 0, Math.PI * 2);
    ctx.stroke();

    // Ascending sparkle particles
    particles.forEach((p) => {
      ctx.fillStyle = `rgba(255, 255, 255, ${p.alpha * alpha})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * 1.3, 0, Math.PI * 2);
      ctx.fill();
    });

    ctx.restore();
  };

  // High-Tech Suspense Targeting Scanner Beam & Lock-on Reticle
  const drawSuspenseScanner = (
    ctx: CanvasRenderingContext2D,
    ufoX: number,
    ufoY: number,
    targetX: number,
    groundY: number,
    isLocked: boolean
  ) => {
    ctx.save();
    const beamColor = isLocked ? 'rgba(239, 68, 68, ' : 'rgba(234, 179, 8, ';
    const coreColor = isLocked ? 'rgba(255, 255, 255, 0.95)' : 'rgba(254, 240, 138, 0.9)';

    // Dynamic searchlight beam from UFO aperture down to targetX
    const grad = ctx.createLinearGradient(ufoX, ufoY, targetX, groundY);
    grad.addColorStop(0, beamColor + '0.85)');
    grad.addColorStop(0.6, beamColor + '0.45)');
    grad.addColorStop(1, beamColor + '0.1)');

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(ufoX - 18, ufoY);
    ctx.lineTo(ufoX + 18, ufoY);
    ctx.lineTo(targetX + 65, groundY);
    ctx.lineTo(targetX - 65, groundY);
    ctx.closePath();
    ctx.fill();

    // Core laser line
    ctx.strokeStyle = coreColor;
    ctx.lineWidth = isLocked ? 4 : 2;
    ctx.beginPath();
    ctx.moveTo(ufoX, ufoY);
    ctx.lineTo(targetX, groundY);
    ctx.stroke();

    // Reticle brackets [ + ] centered on the student's chest
    const reticleY = groundY - 145;
    const d = isLocked ? 44 : 36;
    const len = 12;
    ctx.strokeStyle = isLocked ? '#ef4444' : '#eab308';
    ctx.lineWidth = 3;

    // Top-left
    ctx.beginPath();
    ctx.moveTo(targetX - d, reticleY - d + len);
    ctx.lineTo(targetX - d, reticleY - d);
    ctx.lineTo(targetX - d + len, reticleY - d);
    // Top-right
    ctx.moveTo(targetX + d - len, reticleY - d);
    ctx.lineTo(targetX + d, reticleY - d);
    ctx.lineTo(targetX + d, reticleY - d + len);
    // Bottom-left
    ctx.moveTo(targetX - d, reticleY + d - len);
    ctx.lineTo(targetX - d, reticleY + d);
    ctx.lineTo(targetX - d + len, reticleY + d);
    // Bottom-right
    ctx.moveTo(targetX + d - len, reticleY + d);
    ctx.lineTo(targetX + d, reticleY + d);
    ctx.lineTo(targetX + d, reticleY + d - len);
    ctx.stroke();

    // Center crosshair mark
    ctx.beginPath();
    ctx.moveTo(targetX - 8, reticleY);
    ctx.lineTo(targetX + 8, reticleY);
    ctx.moveTo(targetX, reticleY - 8);
    ctx.lineTo(targetX, reticleY + 8);
    ctx.stroke();

    // Status pill
    if (isLocked) {
      ctx.fillStyle = '#ef4444';
      ctx.font = '900 13px "Be Vietnam Pro", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('ĐÃ KHÓA MỤC TIÊU!', targetX, reticleY - d - 8);
    } else {
      ctx.fillStyle = '#fef08a';
      ctx.font = '800 11px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('ĐANG QUÉT...', targetX, reticleY - d - 6);
    }

    ctx.restore();
  };

  // Student Character Vector Articulation (Sport uniform: Áo vàng ngắn tay cổ bẻ đỏ đô, quần đỏ đô)
  const drawStudent = (ctx: CanvasRenderingContext2D, actor: StudentActor, showLabel: boolean) => {
    ctx.save();
    ctx.translate(actor.x, actor.y);
    ctx.scale(actor.scale * actor.facing, actor.scale);
    ctx.rotate(actor.rotation);

    const isGirl = actor.gender === 'girl';
    const t = actor.animTimer * 8;

    // Leg & arm angles calculated based on action
    let leftLegAngle = 0;
    let rightLegAngle = 0;
    let leftArmAngle = 0;
    let rightArmAngle = 0;
    let bodyBob = 0;

    const isFloated = actor.action === 'BEING_LIFTED' || actor.isBystanderFloated;

    if (actor.action === 'WALK') {
      leftLegAngle = Math.sin(t) * 0.45;
      rightLegAngle = -Math.sin(t) * 0.45;
      leftArmAngle = -Math.sin(t) * 0.4;
      rightArmAngle = Math.sin(t) * 0.4;
      bodyBob = Math.abs(Math.sin(t)) * 3;
    } else if (actor.action === 'PANIC_RUN') {
      const runT = actor.animTimer * 16;
      leftLegAngle = Math.sin(runT) * 0.85;
      rightLegAngle = -Math.sin(runT) * 0.85;
      leftArmAngle = -1.2 + Math.sin(runT) * 0.6;
      rightArmAngle = -1.2 - Math.sin(runT) * 0.6;
      bodyBob = Math.abs(Math.sin(runT)) * 6;
    } else if (actor.action === 'LEAP') {
      leftLegAngle = -0.6;
      rightLegAngle = 0.5;
      leftArmAngle = -2.2;
      rightArmAngle = -2.2;
    } else if (isFloated) {
      // Hilarious panicked flailing & kicking legs while floating in anti-gravity
      const floatT = actor.animTimer * 14;
      leftLegAngle = Math.sin(floatT + actor.x) * 0.75;
      rightLegAngle = -Math.sin(floatT + actor.x) * 0.75;
      leftArmAngle = -2.1 + Math.sin(floatT * 1.2) * 0.7;
      rightArmAngle = -1.8 - Math.sin(floatT * 1.2) * 0.7;
    } else if (actor.action === 'TRIP') {
      leftLegAngle = -1.1;
      rightLegAngle = 1.1;
      leftArmAngle = 0.8;
      rightArmAngle = -0.8;
      bodyBob = 25; // collapsed
    }

    const shirtYellow = '#facc15'; // Áo thể thao vàng tươi
    const pantsRedDo = '#881337';  // Quần đỏ đô (maroon)
    const collarRedDo = '#991b1b'; // Cổ bẻ đỏ đô

    // 1. Back Arm (Yellow short sleeve with red collar cuff trim)
    ctx.save();
    ctx.translate(6, -65 + bodyBob);
    ctx.rotate(rightArmAngle);
    // Yellow short sleeve
    ctx.fillStyle = shirtYellow;
    ctx.fillRect(-4, 0, 8, 14);
    // Red cuff trim
    ctx.fillStyle = collarRedDo;
    ctx.fillRect(-4, 12, 8, 3);
    // Skin forearm
    ctx.fillStyle = '#fcd34d';
    ctx.fillRect(-3, 15, 6, 17);
    ctx.restore();

    // 2. Legs (Quần thể thao màu đỏ đô với sọc trắng bên hông)
    // Left Leg
    ctx.save();
    ctx.translate(-7, -35 + bodyBob);
    ctx.rotate(leftLegAngle);
    ctx.fillStyle = pantsRedDo;
    ctx.fillRect(-5, 0, 10, 24);
    // Sporty white stripe
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(-5, 0, 2, 24);
    // Sports Shoes (White sneaker with red trim)
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(-6, 24, 14, 8);
    ctx.fillStyle = collarRedDo;
    ctx.fillRect(-5, 27, 8, 3);
    ctx.restore();

    // Right Leg
    ctx.save();
    ctx.translate(7, -35 + bodyBob);
    ctx.rotate(rightLegAngle);
    ctx.fillStyle = pantsRedDo;
    ctx.fillRect(-5, 0, 10, 24);
    // Sporty white stripe
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(3, 0, 2, 24);
    // Sports Shoes
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(-6, 24, 14, 8);
    ctx.fillStyle = collarRedDo;
    ctx.fillRect(-3, 27, 8, 3);
    ctx.restore();

    // 3. Torso / Áo thể thao màu vàng tươi
    ctx.fillStyle = shirtYellow;
    roundRect(ctx, -14, -72 + bodyBob, 28, 38, 4);
    ctx.fill();

    // Red folded polo collar (Cổ bẻ màu đỏ đô)
    ctx.fillStyle = collarRedDo;
    // Left collar flap
    ctx.beginPath();
    ctx.moveTo(-9, -74 + bodyBob);
    ctx.lineTo(0, -60 + bodyBob);
    ctx.lineTo(-4, -60 + bodyBob);
    ctx.lineTo(-11, -71 + bodyBob);
    ctx.closePath();
    ctx.fill();
    // Right collar flap
    ctx.beginPath();
    ctx.moveTo(9, -74 + bodyBob);
    ctx.lineTo(0, -60 + bodyBob);
    ctx.lineTo(4, -60 + bodyBob);
    ctx.lineTo(11, -71 + bodyBob);
    ctx.closePath();
    ctx.fill();
    // Collar band around back neck
    ctx.fillRect(-10, -74 + bodyBob, 20, 3);

    // Front Placket & Sports buttons
    ctx.fillStyle = collarRedDo;
    ctx.fillRect(-2, -60 + bodyBob, 4, 12);
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(0, -56 + bodyBob, 1.5, 0, Math.PI * 2);
    ctx.arc(0, -50 + bodyBob, 1.5, 0, Math.PI * 2);
    ctx.fill();

    if (isGirl) {
      // Váy/Quần thể thao nữ sinh màu đỏ đô
      ctx.fillStyle = pantsRedDo;
      ctx.beginPath();
      ctx.moveTo(-15, -42 + bodyBob);
      ctx.lineTo(15, -42 + bodyBob);
      ctx.lineTo(19, -24 + bodyBob);
      ctx.lineTo(-19, -24 + bodyBob);
      ctx.closePath();
      ctx.fill();
      // White trim on skirt
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(-18, -26 + bodyBob);
      ctx.lineTo(18, -26 + bodyBob);
      ctx.stroke();
    }

    // 4. Head & Face
    const headY = -86 + bodyBob;
    // Neck
    ctx.fillStyle = '#fcd34d';
    ctx.fillRect(-4, headY + 10, 8, 8);
    // Round Head
    ctx.fillStyle = '#fde68a';
    ctx.beginPath();
    ctx.arc(0, headY, 16, 0, Math.PI * 2);
    ctx.fill();

    // Face features
    if (isFloated || actor.action === 'PANIC_RUN') {
      // Wide terrified eyes
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(4, headY - 2, 4.5, 0, Math.PI * 2);
      ctx.arc(-4, headY - 2, 4.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.arc(4, headY - 2, 2, 0, Math.PI * 2);
      ctx.arc(-4, headY - 2, 2, 0, Math.PI * 2);
      ctx.fill();
      // Screaming mouth "O"
      ctx.fillStyle = '#b91c1c';
      ctx.beginPath();
      ctx.ellipse(0, headY + 7, 3.5, 5, 0, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // Normal cute eyes
      ctx.fillStyle = '#1e293b';
      ctx.beginPath();
      ctx.arc(4, headY - 2, 2.5, 0, Math.PI * 2);
      ctx.arc(-4, headY - 2, 2.5, 0, Math.PI * 2);
      ctx.fill();
      // Smiling mouth
      ctx.strokeStyle = '#b91c1c';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(0, headY + 4, 3, 0.2, Math.PI - 0.2);
      ctx.stroke();
    }

    // 5. Hair
    ctx.fillStyle = actor.hairColor;
    if (isGirl) {
      if (actor.hairStyle % 2 === 0) {
        ctx.beginPath();
        ctx.arc(0, headY - 5, 17, Math.PI * 0.9, Math.PI * 2.1);
        ctx.fill();
        ctx.fillRect(-18, headY - 14, 12, 26);
        ctx.fillStyle = collarRedDo; // red hair tie matching collar
        ctx.fillRect(-15, headY - 16, 6, 4);
      } else {
        ctx.beginPath();
        ctx.arc(0, headY - 5, 18, Math.PI * 0.8, Math.PI * 2.2);
        ctx.fill();
        ctx.fillRect(-16, headY - 6, 8, 22);
        ctx.fillRect(8, headY - 6, 8, 22);
      }
    } else {
      ctx.beginPath();
      ctx.arc(0, headY - 6, 17, Math.PI * 0.85, Math.PI * 2.15);
      ctx.fill();
      ctx.fillRect(-14, headY - 16, 28, 8);
    }

    // 6. Front Arm (Yellow short sleeve with red cuff)
    ctx.save();
    ctx.translate(-6, -65 + bodyBob);
    ctx.rotate(leftArmAngle);
    ctx.fillStyle = shirtYellow;
    ctx.fillRect(-4, 0, 8, 14);
    ctx.fillStyle = collarRedDo;
    ctx.fillRect(-4, 12, 8, 3);
    ctx.fillStyle = '#fcd34d';
    ctx.fillRect(-3, 15, 6, 17);
    ctx.restore();

    // 7. Alert mark "!" if in Warning state
    if (actor.alertMark) {
      ctx.fillStyle = '#ef4444';
      roundRect(ctx, -5, headY - 45, 10, 16, 3);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(0, headY - 24, 3, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore(); // Undo local rotation/scale so name tag is ALWAYS horizontal and clear!

    // 8. Student Name Tag
    if (showLabel) {
      ctx.save();
      // Calculate tag position above head in world coordinates
      const tagOffset = isFloated ? 120 : 105;
      const labelY = actor.y - tagOffset * actor.scale;
      ctx.font = 'bold 15px "Be Vietnam Pro", sans-serif';
      const textWidth = ctx.measureText(actor.name).width;
      const padX = 14;
      const tagW = textWidth + padX * 2;
      const tagH = 28;

      // Tag background
      ctx.fillStyle = '#ffffff';
      roundRect(ctx, actor.x - tagW / 2, labelY - tagH / 2, tagW, tagH, 14);
      ctx.fill();

      // Border: highlighted red if being lifted
      ctx.strokeStyle = isFloated ? '#ef4444' : '#cbd5e1';
      ctx.lineWidth = isFloated ? 2.5 : 1.5;
      ctx.stroke();

      // Bold text
      ctx.fillStyle = isFloated ? '#b91c1c' : '#0f172a';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(actor.name, actor.x, labelY);

      ctx.restore();
    }
  };

  // Comic Speech Bubble
  const drawSpeechBubble = (ctx: CanvasRenderingContext2D, x: number, y: number, text: string) => {
    ctx.save();
    ctx.font = 'bold 16px "Be Vietnam Pro", sans-serif';
    const textWidth = ctx.measureText(text).width;
    const bw = textWidth + 24;
    const bh = 34;
    const bx = Math.max(bw / 2 + 20, Math.min(V_WIDTH - bw / 2 - 20, x));
    const by = y - 24;

    // Bubble box
    ctx.fillStyle = '#ffffff';
    roundRect(ctx, bx - bw / 2, by - bh / 2, bw, bh, 10);
    ctx.fill();

    // Tail pointing down to speaker
    ctx.beginPath();
    ctx.moveTo(bx - 6, by + bh / 2);
    ctx.lineTo(x, y + 2);
    ctx.lineTo(bx + 8, by + bh / 2);
    ctx.closePath();
    ctx.fill();

    // Border
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 2;
    roundRect(ctx, bx - bw / 2, by - bh / 2, bw, bh, 10);
    ctx.stroke();

    // Text
    ctx.fillStyle = '#0f172a';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, bx, by);

    ctx.restore();
  };

  // UFO Saucer (Enlarged, imposing, high-detail saucer with alien cockpit and LCD counter)
  const drawUFO = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    tilt: number,
    ledPhase: number,
    counter: number,
    total: number
  ) => {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(tilt);

    // 1. Large Glass Cockpit Dome on top
    const domeGrad = ctx.createLinearGradient(0, -95, 0, 0);
    domeGrad.addColorStop(0, 'rgba(56, 189, 248, 0.95)');
    domeGrad.addColorStop(0.7, 'rgba(125, 211, 252, 0.7)');
    domeGrad.addColorStop(1, 'rgba(186, 230, 253, 0.4)');

    ctx.fillStyle = domeGrad;
    ctx.beginPath();
    ctx.ellipse(0, -14, 125, 95, 0, Math.PI, 0);
    ctx.fill();

    // Cute Little Green Alien waving inside the cockpit!
    // Alien Antenna
    ctx.strokeStyle = '#4ade80';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, -56);
    ctx.lineTo(0, -72);
    ctx.stroke();
    ctx.fillStyle = '#facc15';
    ctx.beginPath();
    ctx.arc(0, -74, 5, 0, Math.PI * 2);
    ctx.fill();

    // Alien Head
    ctx.fillStyle = '#4ade80';
    ctx.beginPath();
    ctx.ellipse(0, -42, 20, 24, 0, 0, Math.PI * 2);
    ctx.fill();

    // Big shiny dark alien eyes
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.ellipse(-7, -44, 6.5, 9, 0.3, 0, Math.PI * 2);
    ctx.ellipse(7, -44, 6.5, 9, -0.3, 0, Math.PI * 2);
    ctx.fill();
    // Eye shine dots
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(-8, -47, 2, 0, Math.PI * 2);
    ctx.arc(6, -47, 2, 0, Math.PI * 2);
    ctx.fill();

    // Waving alien hand
    ctx.strokeStyle = '#4ade80';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(14, -34);
    ctx.lineTo(26, -50);
    ctx.stroke();
    ctx.fillStyle = '#4ade80';
    ctx.beginPath();
    ctx.arc(26, -50, 4, 0, Math.PI * 2);
    ctx.fill();

    // Double glass shine reflections
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.ellipse(0, -32, 95, 65, -0.3, Math.PI * 1.15, Math.PI * 1.55);
    ctx.stroke();
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(0, -32, 105, 75, -0.3, Math.PI * 1.25, Math.PI * 1.45);
    ctx.stroke();

    // 2. Large Metallic Saucer Upper Hull (Enlarged 330px width!)
    const hullGrad = ctx.createLinearGradient(0, -30, 0, 50);
    hullGrad.addColorStop(0, '#ffffff');
    hullGrad.addColorStop(0.35, '#f1f5f9');
    hullGrad.addColorStop(0.7, '#cbd5e1');
    hullGrad.addColorStop(1, '#64748b');

    ctx.fillStyle = hullGrad;
    ctx.beginPath();
    ctx.ellipse(0, 16, 330, 68, 0, 0, Math.PI * 2);
    ctx.fill();

    // Subtle metallic rim accent
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.ellipse(0, 12, 325, 64, 0, 0, Math.PI * 2);
    ctx.stroke();

    // 3. Lower Hull / Rim
    ctx.fillStyle = '#475569';
    ctx.beginPath();
    ctx.ellipse(0, 38, 300, 52, 0, 0, Math.PI * 2);
    ctx.fill();

    // 4. Central Aperture / Emitter at the bottom
    ctx.fillStyle = '#38bdf8';
    ctx.beginPath();
    ctx.ellipse(0, 50, 75, 26, 0, 0, Math.PI * 2);
    ctx.fill();
    // Inner glowing aperture ring
    ctx.fillStyle = '#a5f3fc';
    ctx.beginPath();
    ctx.ellipse(0, 50, 40, 15, 0, 0, Math.PI * 2);
    ctx.fill();

    // 5. Perimeter LED Cabochon Lights (14 cycling rainbow lights)
    const ledCount = 14;
    const colors = ['#ef4444', '#f59e0b', '#10b981', '#06b6d4', '#6366f1', '#ec4899'];
    for (let i = 0; i < ledCount; i++) {
      const angle = (i / ledCount) * Math.PI;
      const lx = Math.cos(angle) * 285;
      const ly = 18 + Math.sin(angle) * 44;

      const colorIdx = Math.floor((i + ledPhase) % colors.length);
      ctx.fillStyle = colors[colorIdx];
      ctx.beginPath();
      ctx.arc(lx, ly, 7.5, 0, Math.PI * 2);
      ctx.fill();

      // Outer glow aura around LED
      ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.beginPath();
      ctx.arc(lx, ly, 3, 0, Math.PI * 2);
      ctx.fill();
    }

    // 6. Front LCD Counter Screen (Enlarged with bold glowing counter)
    ctx.fillStyle = '#022c22'; // dark LCD bezel
    roundRect(ctx, -68, 0, 136, 42, 8);
    ctx.fill();
    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // Counter Text (Glowing green white `0/2`, `1/2`, `2/2`)
    ctx.fillStyle = '#34d399';
    ctx.font = 'bold 26px "Courier New", monospace, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${counter}/${total}`, 0, 21);

    ctx.restore();
  };

  // Utility: rounded rect path helper
  const roundRect = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    r: number
  ) => {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  };

  return (
    <div className="relative w-full h-full flex items-center justify-center overflow-hidden bg-slate-950">
      <canvas
        ref={canvasRef}
        width={V_WIDTH}
        height={V_HEIGHT}
        className="w-full h-full object-contain max-h-screen select-none pointer-events-none"
      />
    </div>
  );
};
