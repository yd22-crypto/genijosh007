import React, { useEffect, useRef } from 'react';
import {
  GameStage,
  PlayerRBC,
  GameObject,
  Particle,
  FloatingText,
  GameStats,
} from '../types/game';
import { soundManager } from '../lib/audio';

interface CanvasProps {
  stage: GameStage;
  stats: GameStats;
  onUpdateStats: (updater: (prev: GameStats) => GameStats) => void;
  onStageChange: (newStage: GameStage) => void;
  isPaused: boolean;
  onTriggerDeliver?: () => void;
}

export const BloodstreamCanvas: React.FC<CanvasProps> = ({
  stage,
  stats,
  onUpdateStats,
  onStageChange,
  isPaused,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // References for game state inside animation loop
  const stageRef = useRef<GameStage>(stage);
  stageRef.current = stage;

  const statsRef = useRef<GameStats>(stats);
  statsRef.current = stats;

  const playerRef = useRef<PlayerRBC>({
    x: 120,
    y: 200,
    radius: 22,
    targetY: 200,
    oxygenCount: 0,
    invincibleTimer: 0,
    rotation: 0,
    trail: [],
  });

  const objectsRef = useRef<GameObject[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const floatingTextsRef = useRef<FloatingText[]>([]);
  const backgroundRBCsRef = useRef<{ x: number; y: number; r: number; speed: number; alpha: number; angle: number }[]>([]);

  const keysPressedRef = useRef<{ [key: string]: boolean }>({});
  const lastTimeRef = useRef<number>(performance.now());
  const spawnTimerRef = useRef<number>(0);
  const stageTimerRef = useRef<number>(0);
  const heartbeatTimerRef = useRef<number>(0);
  const pulsePhaseRef = useRef<number>(0);
  const screenShakeRef = useRef<number>(0);

  // Initialize background floating RBCs
  useEffect(() => {
    const rbcPool: { x: number; y: number; r: number; speed: number; alpha: number; angle: number }[] = [];
    for (let i = 0; i < 18; i++) {
      rbcPool.push({
        x: Math.random() * 900,
        y: 40 + Math.random() * 320,
        r: 12 + Math.random() * 12,
        speed: 1.5 + Math.random() * 3.5,
        alpha: 0.2 + Math.random() * 0.35,
        angle: Math.random() * Math.PI * 2,
      });
    }
    backgroundRBCsRef.current = rbcPool;
  }, []);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['ArrowUp', 'ArrowDown', 'KeyW', 'KeyS', 'Space'].includes(e.code)) {
        e.preventDefault();
      }
      keysPressedRef.current[e.code] = true;

      // Quick oxygen deliver trigger with Space in Tissue Stage
      if (e.code === 'Space' && stageRef.current === 'TISSUE_CELLS') {
        attemptManualOxygenDelivery();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysPressedRef.current[e.code] = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Helper: Manual deliver oxygen to closest hungry cell
  const attemptManualOxygenDelivery = () => {
    const player = playerRef.current;
    if (player.oxygenCount <= 0) return;

    // Find nearest waiting tissue cell
    const cell = objectsRef.current.find(
      (o) => o.type === 'TISSUE_CELL' && o.state === 'waiting' && Math.abs(o.x - player.x) < 180
    );

    if (cell) {
      cell.state = 'delivered';
      player.oxygenCount = Math.max(0, player.oxygenCount - 1);
      soundManager.playDeliverOxygen();

      // Particles & score
      spawnParticleBurst(cell.x, cell.y, '#10b981', 20);
      addFloatingText(cell.x, cell.y - 20, '+1,000p 산소 공급! (ATP 합성 ⚡)', '#34d399');

      onUpdateStats((prev) => ({
        ...prev,
        score: prev.score + 1000,
        oxygenDelivered: prev.oxygenDelivered + 1,
      }));
    }
  };

  // Touch / mouse steer
  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleY = canvas.height / rect.height;
    const touchY = (e.clientY - rect.top) * scaleY;
    playerRef.current.targetY = Math.max(45, Math.min(canvas.height - 45, touchY));
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    handlePointerMove(e);
    if (stageRef.current === 'TISSUE_CELLS') {
      attemptManualOxygenDelivery();
    }
  };

  const addFloatingText = (x: number, y: number, text: string, color: string) => {
    floatingTextsRef.current.push({
      id: Math.random().toString(),
      x,
      y,
      text,
      color,
      alpha: 1,
      vy: -1.2,
    });
  };

  const spawnParticleBurst = (x: number, y: number, color: string, count = 12) => {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1.5 + Math.random() * 4;
      particlesRef.current.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        radius: 2 + Math.random() * 3.5,
        color,
        alpha: 1,
        life: 0,
        maxLife: 25 + Math.random() * 20,
      });
    }
  };

  // Main Game Loop
  useEffect(() => {
    let animId: number;

    const loop = (timestamp: number) => {
      const dt = Math.min((timestamp - lastTimeRef.current) / 1000, 0.1);
      lastTimeRef.current = timestamp;

      if (!isPaused && (stageRef.current === 'LUNG' || stageRef.current === 'HEART_OUT' || stageRef.current === 'TISSUE_CELLS' || stageRef.current === 'HEART_IN')) {
        updateGame(dt);
      }

      renderGame();
      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [isPaused]);

  // Update Game Physics & State
  const updateGame = (dt: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const currentStage = stageRef.current;
    const player = playerRef.current;

    pulsePhaseRef.current += dt * 3;
    if (screenShakeRef.current > 0) {
      screenShakeRef.current = Math.max(0, screenShakeRef.current - dt * 10);
    }

    // 1. Player Movement & Keyboard
    let moveY = 0;
    if (keysPressedRef.current['ArrowUp'] || keysPressedRef.current['KeyW']) moveY -= 1;
    if (keysPressedRef.current['ArrowDown'] || keysPressedRef.current['KeyS']) moveY += 1;

    if (moveY !== 0) {
      player.targetY += moveY * 340 * dt;
    }
    player.targetY = Math.max(50, Math.min(canvas.height - 50, player.targetY));
    player.y += (player.targetY - player.y) * 12 * dt;
    player.rotation = (player.targetY - player.y) * 0.003;

    // Player invincibility timer
    if (player.invincibleTimer > 0) {
      player.invincibleTimer = Math.max(0, player.invincibleTimer - dt);
    }

    // Player trail
    if (Math.random() < 0.4) {
      player.trail.unshift({ x: player.x, y: player.y, alpha: 0.6 });
      if (player.trail.length > 8) player.trail.pop();
    }
    player.trail.forEach((t) => {
      t.x -= 150 * dt;
      t.alpha -= dt * 1.5;
    });
    player.trail = player.trail.filter((t) => t.alpha > 0);

    // 2. Stage Specific Timers & Progression
    stageTimerRef.current += dt;

    // Heartbeat Audio trigger during heart stages
    if (currentStage === 'HEART_OUT' || currentStage === 'HEART_IN') {
      heartbeatTimerRef.current += dt;
      if (heartbeatTimerRef.current >= 0.7) {
        heartbeatTimerRef.current = 0;
        soundManager.playHeartbeat();
      }
    }

    // General Total Time Decrement
    onUpdateStats((prev) => {
      const newTotal = Math.max(0, prev.totalTimeLeft - dt);
      return {
        ...prev,
        totalTimeLeft: newTotal,
        totalDistance: prev.totalDistance + (currentStage === 'HEART_OUT' ? 600 : 250) * dt,
      };
    });

    if (statsRef.current.totalTimeLeft <= 0) {
      onStageChange('GAME_OVER');
      return;
    }

    // Stage 1: LUNG
    if (currentStage === 'LUNG') {
      // Oxygen items spawn frequently
      spawnTimerRef.current += dt;
      if (spawnTimerRef.current >= 1.0) {
        spawnTimerRef.current = 0;
        spawnLungObjects(canvas);
      }

      // Check if 5 oxygens collected
      if (player.oxygenCount >= 5) {
        stageTimerRef.current = 0;
        soundManager.playHeartbeat();
        addFloatingText(canvas.width / 2, canvas.height / 2 - 30, '산소 5개 충전 완료! 심장으로 진입!', '#38bdf8');
        onStageChange('HEART_OUT');
        return;
      }
    }

    // Stage 2: HEART_OUT (Transit 3.5s)
    else if (currentStage === 'HEART_OUT') {
      if (stageTimerRef.current >= 3.5) {
        stageTimerRef.current = 0;
        objectsRef.current = [];
        addFloatingText(canvas.width / 2, canvas.height / 2 - 30, '온몸 조직세포 도착! 1분간 산소를 전달하세요!', '#fbbf24');
        onStageChange('TISSUE_CELLS');
        return;
      }
    }

    // Stage 3: TISSUE_CELLS (1 minute = 60s)
    else if (currentStage === 'TISSUE_CELLS') {
      // Tissue timer countdown
      onUpdateStats((prev) => {
        const nextTissueTime = Math.max(0, prev.tissueZoneTimeLeft - dt);
        return {
          ...prev,
          tissueZoneTimeLeft: nextTissueTime,
        };
      });

      // Spawn objects in tissue zone
      spawnTimerRef.current += dt;
      if (spawnTimerRef.current >= 1.1) {
        spawnTimerRef.current = 0;
        spawnTissueObjects(canvas);
      }

      // End of tissue zone (60 seconds completed!)
      if (statsRef.current.tissueZoneTimeLeft <= 0) {
        stageTimerRef.current = 0;
        objectsRef.current = [];
        soundManager.playHeartbeat();
        addFloatingText(canvas.width / 2, canvas.height / 2 - 30, '조직세포 구역 완료! 대정맥을 통해 폐로 복귀합니다!', '#c084fc');
        onStageChange('HEART_IN');
        return;
      }
    }

    // Stage 4: HEART_IN (Transit 3.5s back to lung)
    else if (currentStage === 'HEART_IN') {
      if (stageTimerRef.current >= 3.5) {
        stageTimerRef.current = 0;
        soundManager.playVictory();
        onStageChange('VICTORY');
        return;
      }
    }

    // 3. Move Game Objects & Check Collisions
    const speedMult = currentStage === 'HEART_OUT' ? 2.5 : 1.0;
    const objects = objectsRef.current;

    for (let i = objects.length - 1; i >= 0; i--) {
      const obj = objects[i];
      obj.x -= obj.vx * speedMult * dt;
      if (obj.vy) obj.y += obj.vy * dt;

      // Pulse animation
      if (obj.pulse !== undefined) {
        obj.pulse += dt * 4;
      }

      // Proximity check for tissue cell auto-delivery
      if (obj.type === 'TISSUE_CELL' && obj.state === 'waiting' && player.oxygenCount > 0) {
        const dist = Math.hypot(player.x - obj.x, player.y - obj.y);
        if (dist < 70) {
          obj.state = 'delivered';
          player.oxygenCount = Math.max(0, player.oxygenCount - 1);
          soundManager.playDeliverOxygen();
          spawnParticleBurst(obj.x, obj.y, '#10b981', 18);
          addFloatingText(obj.x, obj.y - 25, '+1,000p 세포 산소 전달! ⚡', '#34d399');

          onUpdateStats((prev) => ({
            ...prev,
            score: prev.score + 1000,
            oxygenDelivered: prev.oxygenDelivered + 1,
          }));
        }
      }

      // Player collision check
      const dist = Math.hypot(player.x - obj.x, player.y - obj.y);
      const hitRadius = player.radius + obj.radius;

      if (dist < hitRadius) {
        if (obj.type === 'OXYGEN') {
          // Collect Oxygen
          if (player.oxygenCount < 5) {
            player.oxygenCount++;
            soundManager.playOxygenCollect();
            spawnParticleBurst(obj.x, obj.y, '#38bdf8', 14);
            addFloatingText(obj.x, obj.y - 20, `+300 산소 결합 (${player.oxygenCount}/5)`, '#38bdf8');
            onUpdateStats((prev) => ({
              ...prev,
              score: prev.score + 300,
              oxygenCollected: prev.oxygenCollected + 1,
            }));
          }
          objects.splice(i, 1);
          continue;
        } else if (obj.type === 'PLATELET') {
          // Collect Platelet: User requested: +500 points! +2 seconds bonus!
          soundManager.playPlateletCollect();
          spawnParticleBurst(obj.x, obj.y, '#eab308', 16);
          addFloatingText(obj.x, obj.y - 20, '+500p 혈소판 치료 (+2초)', '#fde047');
          onUpdateStats((prev) => ({
            ...prev,
            score: prev.score + 500,
            totalTimeLeft: prev.totalTimeLeft + 2,
            tissueZoneTimeLeft: prev.tissueZoneTimeLeft + 2,
            plateletsCollected: prev.plateletsCollected + 1,
          }));
          objects.splice(i, 1);
          continue;
        } else if (obj.type === 'WBC') {
          // WBC Collision: Obstacle! -3s penalty, stun invincibility
          if (player.invincibleTimer <= 0) {
            player.invincibleTimer = 1.3;
            screenShakeRef.current = 8;
            soundManager.playWbcCollision();
            spawnParticleBurst(player.x, player.y, '#f43f5e', 14);
            addFloatingText(player.x, player.y - 25, '-3초 백혈구 식균 방해!', '#f43f5e');

            onUpdateStats((prev) => ({
              ...prev,
              totalTimeLeft: Math.max(0, prev.totalTimeLeft - 3),
              tissueZoneTimeLeft: Math.max(0, prev.tissueZoneTimeLeft - 3),
              wbcCollisions: prev.wbcCollisions + 1,
            }));
          }
        }
      }

      // Cleanup offscreen objects
      if (obj.x < -80) {
        objects.splice(i, 1);
      }
    }

    // 4. Update Background RBCs
    backgroundRBCsRef.current.forEach((rbc) => {
      rbc.x -= (rbc.speed * 40 + (currentStage === 'HEART_OUT' ? 300 : 0)) * dt;
      if (rbc.x < -50) {
        rbc.x = canvas.width + 50;
        rbc.y = 45 + Math.random() * (canvas.height - 90);
      }
    });

    // 5. Update Particles
    for (let i = particlesRef.current.length - 1; i >= 0; i--) {
      const p = particlesRef.current[i];
      p.x += p.vx;
      p.y += p.vy;
      p.life++;
      p.alpha = 1 - p.life / p.maxLife;
      if (p.life >= p.maxLife) {
        particlesRef.current.splice(i, 1);
      }
    }

    // 6. Update Floating Texts
    for (let i = floatingTextsRef.current.length - 1; i >= 0; i--) {
      const ft = floatingTextsRef.current[i];
      ft.y += ft.vy;
      ft.alpha -= dt * 1.0;
      if (ft.alpha <= 0) {
        floatingTextsRef.current.splice(i, 1);
      }
    }
  };

  // Spawners for Stage 1 (LUNG)
  const spawnLungObjects = (canvas: HTMLCanvasElement) => {
    const y = 60 + Math.random() * (canvas.height - 120);
    const rand = Math.random();

    // Spawn Oxygen with high probability
    if (rand < 0.6) {
      objectsRef.current.push({
        id: Math.random().toString(),
        type: 'OXYGEN',
        x: canvas.width + 40,
        y,
        radius: 16,
        vx: 180 + Math.random() * 60,
        pulse: 0,
      });
    } else if (rand < 0.8) {
      // Platelet bonus item
      objectsRef.current.push({
        id: Math.random().toString(),
        type: 'PLATELET',
        x: canvas.width + 40,
        y,
        radius: 14,
        vx: 210 + Math.random() * 50,
        pulse: 0,
      });
    } else {
      // WBC obstacle
      objectsRef.current.push({
        id: Math.random().toString(),
        type: 'WBC',
        x: canvas.width + 50,
        y,
        radius: 28,
        vx: 150 + Math.random() * 40,
        pulse: 0,
      });
    }
  };

  // Spawners for Stage 3 (TISSUE CELLS)
  const spawnTissueObjects = (canvas: HTMLCanvasElement) => {
    const rand = Math.random();

    // 1. Always periodically spawn Hungry Tissue Cells
    if (rand < 0.42) {
      // Spawn near vessel walls (top or bottom or mid-path)
      const isTop = Math.random() < 0.5;
      const cellY = isTop ? 70 : canvas.height - 70;

      objectsRef.current.push({
        id: Math.random().toString(),
        type: 'TISSUE_CELL',
        x: canvas.width + 60,
        y: cellY,
        radius: 26,
        vx: 140,
        state: 'waiting',
        pulse: 0,
      });
    } else if (rand < 0.72) {
      // Platelet bonus (+500p!)
      const y = 80 + Math.random() * (canvas.height - 160);
      objectsRef.current.push({
        id: Math.random().toString(),
        type: 'PLATELET',
        x: canvas.width + 40,
        y,
        radius: 14,
        vx: 220 + Math.random() * 60,
        pulse: 0,
      });
    } else {
      // WBC obstacle (more active in tissue capillaries)
      const y = 70 + Math.random() * (canvas.height - 140);
      objectsRef.current.push({
        id: Math.random().toString(),
        type: 'WBC',
        x: canvas.width + 50,
        y,
        radius: 30,
        vx: 160 + Math.random() * 50,
        pulse: 0,
      });
    }
  };

  // Render Game Scene
  const renderGame = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.save();

    // Screen Shake on impact
    if (screenShakeRef.current > 0) {
      const shakeX = (Math.random() - 0.5) * screenShakeRef.current;
      const shakeY = (Math.random() - 0.5) * screenShakeRef.current;
      ctx.translate(shakeX, shakeY);
    }

    // 1. Blood Vessel Background
    renderVesselBackground(ctx, canvas);

    // 2. Background Floating RBCs (Immersion)
    renderBackgroundRBCs(ctx);

    // 3. Game Objects (Oxygen, WBC, Platelets, Tissue Cells)
    objectsRef.current.forEach((obj) => renderGameObject(ctx, obj));

    // 4. Player RBC
    renderPlayer(ctx, playerRef.current);

    // 5. Particles
    particlesRef.current.forEach((p) => {
      ctx.save();
      ctx.globalAlpha = Math.max(0, p.alpha);
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });

    // 6. Floating Texts
    floatingTextsRef.current.forEach((ft) => {
      ctx.save();
      ctx.globalAlpha = Math.max(0, ft.alpha);
      ctx.font = 'bold 15px "Noto Sans KR", sans-serif';
      ctx.fillStyle = ft.color;
      ctx.shadowColor = 'rgba(0,0,0,0.8)';
      ctx.shadowBlur = 6;
      ctx.fillText(ft.text, ft.x, ft.y);
      ctx.restore();
    });

    // 7. Transition Overlay for Heart Rushes
    if (stageRef.current === 'HEART_OUT' || stageRef.current === 'HEART_IN') {
      renderHeartRushOverlay(ctx, canvas);
    }

    ctx.restore();
  };

  // Render Vessel Walls & Blood Plasma
  const renderVesselBackground = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
    const currentStage = stageRef.current;
    const isOxygenRich = playerRef.current.oxygenCount >= 3 || currentStage === 'HEART_OUT';

    // Plasma gradient
    const plasmaGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    if (isOxygenRich) {
      // Arterial blood tone: rich warm crimson-rose
      plasmaGrad.addColorStop(0, '#450a0a');
      plasmaGrad.addColorStop(0.5, '#7f1d1d');
      plasmaGrad.addColorStop(1, '#450a0a');
    } else {
      // Venous blood tone: darker plum-crimson
      plasmaGrad.addColorStop(0, '#2e0813');
      plasmaGrad.addColorStop(0.5, '#4c0519');
      plasmaGrad.addColorStop(1, '#2e0813');
    }

    ctx.fillStyle = plasmaGrad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Vessel wall pulses (Endothelial lining)
    const pulse = Math.sin(pulsePhaseRef.current) * 4;

    // Top vessel wall
    ctx.fillStyle = '#1c0409';
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(canvas.width, 0);
    ctx.lineTo(canvas.width, 36 + pulse);
    ctx.quadraticCurveTo(canvas.width * 0.5, 30 - pulse, 0, 36 + pulse);
    ctx.closePath();
    ctx.fill();

    // Top endothelial cells
    ctx.fillStyle = '#881337';
    for (let x = 10; x < canvas.width; x += 38) {
      ctx.beginPath();
      ctx.ellipse(x, 26 + pulse * 0.5, 16, 8, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    // Bottom vessel wall
    ctx.fillStyle = '#1c0409';
    ctx.beginPath();
    ctx.moveTo(0, canvas.height);
    ctx.lineTo(canvas.width, canvas.height);
    ctx.lineTo(canvas.width, canvas.height - 36 - pulse);
    ctx.quadraticCurveTo(canvas.width * 0.5, canvas.height - 30 + pulse, 0, canvas.height - 36 - pulse);
    ctx.closePath();
    ctx.fill();

    // Bottom endothelial cells
    ctx.fillStyle = '#881337';
    for (let x = 10; x < canvas.width; x += 38) {
      ctx.beginPath();
      ctx.ellipse(x, canvas.height - 26 - pulse * 0.5, 16, 8, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  };

  // Render Background RBCs
  const renderBackgroundRBCs = (ctx: CanvasRenderingContext2D) => {
    backgroundRBCsRef.current.forEach((rbc) => {
      ctx.save();
      ctx.globalAlpha = rbc.alpha;
      ctx.translate(rbc.x, rbc.y);
      ctx.rotate(rbc.angle);

      // Biconcave disc effect
      const grad = ctx.createRadialGradient(0, 0, rbc.r * 0.3, 0, 0, rbc.r);
      grad.addColorStop(0, '#7f1d1d');
      grad.addColorStop(0.7, '#dc2626');
      grad.addColorStop(1, '#991b1b');

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.ellipse(0, 0, rbc.r, rbc.r * 0.7, 0, 0, Math.PI * 2);
      ctx.fill();

      // Dimple center
      ctx.fillStyle = 'rgba(69, 10, 10, 0.6)';
      ctx.beginPath();
      ctx.ellipse(0, 0, rbc.r * 0.45, rbc.r * 0.3, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    });
  };

  // Render Player Red Blood Cell
  const renderPlayer = (ctx: CanvasRenderingContext2D, player: PlayerRBC) => {
    ctx.save();
    ctx.translate(player.x, player.y);
    ctx.rotate(player.rotation);

    // Invincibility flash
    if (player.invincibleTimer > 0 && Math.floor(performance.now() / 80) % 2 === 0) {
      ctx.globalAlpha = 0.4;
    }

    // Oxygen glow color mapping
    // 0: #581c24 (어두운 암적색 - 정맥혈)
    // 5: #ff2b44 (밝은 선홍색 - 동맥혈)
    const oxyRatio = Math.min(1, Math.max(0, player.oxygenCount / 5));

    // Outer oxygen aura if holding oxygen
    if (player.oxygenCount > 0) {
      ctx.save();
      ctx.shadowColor = `rgba(56, 189, 248, ${0.3 + oxyRatio * 0.5})`;
      ctx.shadowBlur = 12 + oxyRatio * 16;
      ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
      ctx.beginPath();
      ctx.ellipse(0, 0, player.radius + 6, (player.radius + 6) * 0.75, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // Draw Biconcave Disc
    const rbcGrad = ctx.createRadialGradient(
      -4, -4, player.radius * 0.2,
      0, 0, player.radius
    );

    if (oxyRatio >= 0.8) {
      // Bright Scarlet (동맥혈, 산소 풍부)
      rbcGrad.addColorStop(0, '#ff6b81');
      rbcGrad.addColorStop(0.5, '#ef233c');
      rbcGrad.addColorStop(1, '#a71d2a');
    } else if (oxyRatio >= 0.4) {
      // Intermediate red
      rbcGrad.addColorStop(0, '#e63946');
      rbcGrad.addColorStop(0.6, '#b5172d');
      rbcGrad.addColorStop(1, '#660708');
    } else {
      // Dark Crimson / Purplish (정맥혈, 산소 부족)
      rbcGrad.addColorStop(0, '#9d0208');
      rbcGrad.addColorStop(0.6, '#6a040f');
      rbcGrad.addColorStop(1, '#370617');
    }

    ctx.fillStyle = rbcGrad;
    ctx.beginPath();
    ctx.ellipse(0, 0, player.radius, player.radius * 0.72, 0, 0, Math.PI * 2);
    ctx.fill();

    // Inner concavity / dimple of RBC
    const dimpleGrad = ctx.createRadialGradient(
      0, 0, 2,
      0, 0, player.radius * 0.5
    );
    dimpleGrad.addColorStop(0, 'rgba(30, 4, 8, 0.75)');
    dimpleGrad.addColorStop(0.8, 'rgba(120, 15, 25, 0.35)');
    dimpleGrad.addColorStop(1, 'transparent');

    ctx.fillStyle = dimpleGrad;
    ctx.beginPath();
    ctx.ellipse(0, 0, player.radius * 0.52, player.radius * 0.36, 0, 0, Math.PI * 2);
    ctx.fill();

    // Render loaded Oxygen molecules circling around or bonded
    if (player.oxygenCount > 0) {
      for (let i = 0; i < player.oxygenCount; i++) {
        const angle = (i / 5) * Math.PI * 2 + pulsePhaseRef.current * 1.5;
        const ox = Math.cos(angle) * (player.radius * 0.65);
        const oy = Math.sin(angle) * (player.radius * 0.45);

        ctx.fillStyle = '#38bdf8';
        ctx.beginPath();
        ctx.arc(ox, oy, 4, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(ox - 1, oy - 1, 1.5, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Player Label
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 10px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('적혈구', 0, -player.radius - 4);

    ctx.restore();
  };

  // Render Game Objects (Oxygen, WBC, Platelet, Tissue Cell)
  const renderGameObject = (ctx: CanvasRenderingContext2D, obj: GameObject) => {
    ctx.save();
    ctx.translate(obj.x, obj.y);

    if (obj.type === 'OXYGEN') {
      // Oxygen Molecule (O=O double atom)
      const pulse = Math.sin((obj.pulse || 0) * 3) * 2;
      const r = obj.radius + pulse;

      // Glow
      ctx.shadowColor = '#38bdf8';
      ctx.shadowBlur = 15;

      // Left Oxygen atom
      const grad = ctx.createRadialGradient(-5, -2, 2, -5, -2, r * 0.55);
      grad.addColorStop(0, '#e0f2fe');
      grad.addColorStop(0.4, '#38bdf8');
      grad.addColorStop(1, '#0284c7');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(-6, 0, r * 0.55, 0, Math.PI * 2);
      ctx.fill();

      // Right Oxygen atom
      ctx.beginPath();
      ctx.arc(6, 0, r * 0.55, 0, Math.PI * 2);
      ctx.fill();

      // Bond line
      ctx.strokeStyle = '#bae6fd';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(-6, -2);
      ctx.lineTo(6, -2);
      ctx.moveTo(-6, 2);
      ctx.lineTo(6, 2);
      ctx.stroke();

      // Label: O2
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 11px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('O₂', 0, 4);
    } else if (obj.type === 'PLATELET') {
      // Platelet (혈소판: golden shard with twinkling edges)
      const pulse = Math.sin((obj.pulse || 0) * 4) * 2;
      const r = obj.radius + pulse;

      ctx.shadowColor = '#facc15';
      ctx.shadowBlur = 16;

      // Golden diamond/shard geometry
      ctx.fillStyle = '#fde047';
      ctx.beginPath();
      ctx.moveTo(0, -r);
      ctx.lineTo(r * 0.8, -r * 0.2);
      ctx.lineTo(r, r * 0.6);
      ctx.lineTo(0, r);
      ctx.lineTo(-r * 0.7, r * 0.5);
      ctx.lineTo(-r, -r * 0.3);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.ellipse(-2, -3, 3, 2, 0, 0, Math.PI * 2);
      ctx.fill();

      // Label: 혈소판 (+500p)
      ctx.fillStyle = '#fef08a';
      ctx.font = 'bold 9px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('혈소판', 0, r + 11);
    } else if (obj.type === 'WBC') {
      // White Blood Cell (백혈구: ameboid cell with lobed nucleus)
      const p = obj.pulse || 0;
      const r = obj.radius;

      // Wobbling ameboid membrane
      ctx.shadowColor = 'rgba(255, 255, 255, 0.4)';
      ctx.shadowBlur = 12;

      ctx.fillStyle = '#f8fafc';
      ctx.beginPath();
      for (let a = 0; a < Math.PI * 2; a += Math.PI / 8) {
        const offset = Math.sin(a * 4 + p) * 3;
        const dist = r + offset;
        const px = Math.cos(a) * dist;
        const py = Math.sin(a) * dist;
        if (a === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fill();

      // Multilobed nucleus inside (다형핵 백혈구 표현)
      ctx.fillStyle = '#818cf8';
      [-7, 5, 0].forEach((ox, idx) => {
        const oy = idx === 2 ? 6 : -4;
        ctx.beginPath();
        ctx.arc(ox, oy, 6, 0, Math.PI * 2);
        ctx.fill();
      });

      // Label: 백혈구 (주의!)
      ctx.fillStyle = '#fecdd3';
      ctx.font = 'bold 10px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('백혈구(-3초)', 0, r + 13);
    } else if (obj.type === 'TISSUE_CELL') {
      // Systemic Tissue Cell (온몸 조직세포)
      const r = obj.radius;
      const isDelivered = obj.state === 'delivered';

      // Cell Membrane
      ctx.shadowColor = isDelivered ? '#10b981' : '#f59e0b';
      ctx.shadowBlur = 14;

      const cellGrad = ctx.createRadialGradient(-4, -4, 4, 0, 0, r);
      if (isDelivered) {
        cellGrad.addColorStop(0, '#a7f3d0');
        cellGrad.addColorStop(0.6, '#10b981');
        cellGrad.addColorStop(1, '#064e3b');
      } else {
        cellGrad.addColorStop(0, '#fed7aa');
        cellGrad.addColorStop(0.6, '#f97316');
        cellGrad.addColorStop(1, '#7c2d12');
      }

      ctx.fillStyle = cellGrad;
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.fill();

      // Mitochondria / Nucleus inside
      ctx.fillStyle = isDelivered ? '#047857' : '#9a3412';
      ctx.beginPath();
      ctx.ellipse(-4, -2, 7, 4, Math.PI / 4, 0, Math.PI * 2);
      ctx.fill();

      // Energy sparkle if delivered
      if (isDelivered) {
        ctx.fillStyle = '#34d399';
        ctx.font = 'bold 10px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('ATP ⚡', 0, 4);

        ctx.fillStyle = '#6ee7b7';
        ctx.font = 'bold 9px sans-serif';
        ctx.fillText('공급완료', 0, r + 12);
      } else {
        ctx.fillStyle = '#fef08a';
        ctx.font = 'bold 9px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('산소필요!', 0, 4);

        ctx.fillStyle = '#fdba74';
        ctx.font = 'bold 9px sans-serif';
        ctx.fillText('조직세포', 0, r + 12);
      }
    }

    ctx.restore();
  };

  // Render Heart Rush Overlay during heart transition stages
  const renderHeartRushOverlay = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
    ctx.save();
    // Speed lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
    ctx.lineWidth = 2;
    for (let i = 0; i < 14; i++) {
      const y = (i / 14) * canvas.height;
      const x = ((performance.now() * 2 + i * 80) % canvas.width);
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + 120, y);
      ctx.stroke();
    }

    // Centered Heartbeat Announcement banner
    ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
    ctx.fillRect(0, canvas.height / 2 - 38, canvas.width, 76);

    ctx.fillStyle = '#ffedd5';
    ctx.font = '900 20px "Noto Sans KR", sans-serif';
    ctx.textAlign = 'center';

    if (stageRef.current === 'HEART_OUT') {
      ctx.fillText('❤️ 심장 통과! (폐정맥 ➔ 좌심실 ➔ 대동맥)', canvas.width / 2, canvas.height / 2 - 6);
      ctx.font = 'bold 13px "Noto Sans KR", sans-serif';
      ctx.fillStyle = '#fca5a5';
      ctx.fillText('두근! 두근! 산소가 풍부한 동맥혈이 온몸으로 뿜어져 나갑니다!', canvas.width / 2, canvas.height / 2 + 18);
    } else {
      ctx.fillText('❤️ 심장 귀환! (대정맥 ➔ 우심실 ➔ 폐동맥)', canvas.width / 2, canvas.height / 2 - 6);
      ctx.font = 'bold 13px "Noto Sans KR", sans-serif';
      ctx.fillStyle = '#93c5fd';
      ctx.fillText('산소를 전달한 정맥혈이 다시 산소를 받기 위해 폐로 향합니다!', canvas.width / 2, canvas.height / 2 + 18);
    }

    ctx.restore();
  };

  return (
    <div className="relative w-full overflow-hidden select-none rounded-xl border border-red-950/60 shadow-2xl bg-black">
      <canvas
        ref={canvasRef}
        width={960}
        height={440}
        onPointerMove={handlePointerMove}
        onPointerDown={handlePointerDown}
        className="w-full h-auto block touch-none cursor-pointer aspect-[24/11]"
      />
    </div>
  );
};
