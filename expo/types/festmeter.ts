export interface FestmeterCalculation {
  id: string;
  projectName: string;
  holzart: string;
  qualitaet: string;
  length: number;
  diameter_mid?: number;
  diameter_d1?: number;
  diameter_d2?: number;
  calculationMethodUsed: string;
  volume: number;
  timestamp: string;
}

export interface FestmeterConfig {
  calculationMethod: 'huber_mid' | 'huber_avg_ends' | 'smalian';
  barkDeductionType: 'none' | '%' | 'cm';
  barkDeductionValue: number;
}