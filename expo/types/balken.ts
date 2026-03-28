export interface BalkenLog {
  id: string;
  diameter: number;
  length: number;
}

export interface BalkenConfig {
  allowance: number;
  liveCalc: boolean;
  dibMode: 'dib' | 'oob';
  bark: number;
  volFormula: 'huber' | 'smalian' | 'newton';
  taper: number;
}