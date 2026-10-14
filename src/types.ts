export type GamePhase = 
  | 'IDLE'          // Peaceful day, students walking and chatting
  | 'WARNING'       // Siren alert, exclamation marks, sky darkening
  | 'UFO_ENTER'     // UFO swoops in from above
  | 'CHASE'         // UFO searches, students running & leaping in panic
  | 'MASS_LIFT'     // UFO activates giant beam, sucking ALL students into the air
  | 'SUSPENSE_HOLD' // All students suspended in mid-air in crazy tilted poses for suspense
  | 'SNATCHING'     // UFO sucks targets one by one into the saucer
  | 'MASS_DROP'     // Beam turns off, surviving students drop back to ground
  | 'BEAM_DOWN'     
  | 'LIFTING'       
  | 'SUCKED'        
  | 'UFO_EXIT'      // UFO zooms away, sky brightens back to day
  | 'RESULTS';      // Result dialog pops up with captured students

export type CharacterAction = 
  | 'WALK' 
  | 'IDLE' 
  | 'ALERT' 
  | 'PANIC_RUN' 
  | 'LEAP' 
  | 'TRIP' 
  | 'BEING_LIFTED' 
  | 'CAPTURED' 
  | 'RELIEVED';

export interface Student {
  id: string;
  name: string;
  gender: 'boy' | 'girl';
  hairStyle: number; // 0..5
  hairColor: string;
  pantsColor: string;
  shirtColor: string;
  collarColor?: string;
}

export interface StudentActor extends Student {
  x: number;
  y: number;
  baseX: number;
  baseY: number;
  vx: number;
  vy: number;
  scale: number;
  facing: 1 | -1;
  action: CharacterAction;
  animTimer: number;
  animFrame: number;
  speechText: string | null;
  speechTimer: number;
  alertMark: boolean;
  rotation: number;
  isCaptured: boolean;
  targetLiftProgress: number; // 0 to 1 when being sucked into UFO
  floatAngle: number;         // tilt angle when suspended in gravity (-90 to +90 deg or upside down)
  isBystanderFloated: boolean; // bystander pulled into tractor gravity
  floatHeight: number;        // how high the student floats in air
  clusterTargetX: number;     // converged X pos in suspended cluster
  clusterTargetY: number;     // converged Y pos in suspended cluster
}

export interface ClassRoom {
  id: string;
  name: string;
  students: Student[];
}

export interface GameSettings {
  pickCount: number; // 1 to 10, default 2
  speed: 'slow' | 'normal' | 'fast';
  noRepeat: boolean;
  showLabels: boolean;
  showSpeech: boolean;
  soundEnabled: boolean;
  soundVolume: number; // 0 to 1
  resultTitle: string;
  resultSubtitle: string;
  teacherCredit: string;
}

export interface GameHistoryItem {
  id: string;
  timestamp: string;
  className: string;
  students: { id: string; name: string; gender: 'boy' | 'girl' }[];
}
