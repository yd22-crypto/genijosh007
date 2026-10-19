export type GameStage =
  | 'READY'
  | 'LUNG'           // 1단계: 폐 구역 (산소 5개 수집)
  | 'HEART_OUT'       // 2단계: 심장 통과 (폐정맥 -> 좌심실 -> 대동맥)
  | 'TISSUE_CELLS'    // 3단계: 온몸 조직세포 구역 (1분 동안 산소 전달)
  | 'HEART_IN'        // 4단계: 심장 귀환 (대정맥 -> 우심실 -> 폐동맥)
  | 'VICTORY'         // 미션 성공 (폐 복귀)
  | 'GAME_OVER';      // 미션 실패 (시간 초과)

export interface FloatingText {
  id: string;
  x: number;
  y: number;
  text: string;
  color: string;
  alpha: number;
  vy: number;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  alpha: number;
  life: number;
  maxLife: number;
}

export interface PlayerRBC {
  x: number;
  y: number;
  radius: number;
  targetY: number;
  oxygenCount: number; // 0 to 5
  invincibleTimer: number; // seconds of invincibility
  rotation: number;
  trail: { x: number; y: number; alpha: number }[];
}

export type ObstacleType = 'OXYGEN' | 'WBC' | 'PLATELET' | 'TISSUE_CELL' | 'OTHER_RBC';

export interface GameObject {
  id: string;
  type: ObstacleType;
  x: number;
  y: number;
  radius: number;
  vx: number;
  vy?: number;
  state?: 'waiting' | 'delivered' | 'normal';
  cellNeedOxygen?: boolean;
  pulse?: number;
  phase?: number;
  opacity?: number;
}

export interface GameStats {
  score: number;
  totalTimeLeft: number;      // Overall game timer
  tissueZoneTimeLeft: number;  // 60-second timer during tissue stage
  oxygenCollected: number;
  oxygenDelivered: number;
  plateletsCollected: number;
  wbcCollisions: number;
  totalDistance: number;
}

export interface ScienceConcept {
  id: string;
  title: string;
  subtitle: string;
  tag: string;
  description: string;
  features: string[];
  color: string;
}
