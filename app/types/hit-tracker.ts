// Hit Tracker Data Model
export interface HitTrackerData {
  machine: string;
  dailyHits: {
    [day: string]: number;
  };
  weeklyTotal: number;
}

export interface EfficiencyData {
  machine: string;
  shifts: {
    [shiftName: string]: number[]; // Weekly efficiency values
  };
}

export interface OEEData {
  machine: string;
  availability: string;
  performance: string;
  quality: string;
  oee: string;
  weeklyHits: number;
  yearlyHits: number;
}

export interface HitTrackerImport {
  timestamp: string;
  machines: HitTrackerData[];
  efficiency: { [machine: string]: EfficiencyData };
  oee: OEEData[];
  summary: {
    totalWeeklyHits: number;
    averageOEE: number;
    machineCount: number;
  };
}