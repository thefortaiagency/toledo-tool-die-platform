// Pioneer Excel Data - Extracted and Structured for Reports
// Data from 2024 baseline and 2025 Q1/Q2

export interface MetricData {
  metric: string;
  category: string;
  unit: string;
  target2025: number;
  actual2024: number;
  monthlyData: {
    [key: string]: number;
  };
  quarterlyData: {
    q1: { target: number; actual: number };
    q2: { target: number; actual: number };
    q3: { target: number; actual: number };
    q4: { target: number; actual: number };
  };
}

export const qualityMetrics: MetricData[] = [
  {
    metric: 'Scrap Costs',
    category: 'Quality',
    unit: '$',
    target2025: 425000,
    actual2024: 566951,
    monthlyData: {
      'Jan-25': 29610,
      'Feb-25': 25946,
      'Mar-25': 25273,
      'Apr-25': 26588,
      'May-25': 27641,
      'Jun-25': 28958,
    },
    quarterlyData: {
      q1: { target: 106250, actual: 80829 },
      q2: { target: 106250, actual: 83187 },
      q3: { target: 106250, actual: 0 },
      q4: { target: 106250, actual: 0 },
    },
  },
  {
    metric: 'External Sort Cost',
    category: 'Quality',
    unit: '$',
    target2025: 100000,
    actual2024: 188435,
    monthlyData: {
      'Jan-25': 270,
      'Feb-25': 1841,
      'Mar-25': 2479,
      'Apr-25': 5097,
      'May-25': 1543,
      'Jun-25': 0,
    },
    quarterlyData: {
      q1: { target: 25000, actual: 4590 },
      q2: { target: 25000, actual: 6640 },
      q3: { target: 25000, actual: 0 },
      q4: { target: 25000, actual: 0 },
    },
  },
  {
    metric: 'PPM (Defects)',
    category: 'Quality',
    unit: 'ppm',
    target2025: 25,
    actual2024: 129,
    monthlyData: {
      'Jan-25': 30.5,
      'Feb-25': 16.63,
      'Mar-25': 2.23,
      'Apr-25': 7.73,
      'May-25': 1.06,
      'Jun-25': 2.21,
    },
    quarterlyData: {
      q1: { target: 25, actual: 16.45 },
      q2: { target: 6.25, actual: 11 },
      q3: { target: 6.25, actual: 0 },
      q4: { target: 6.25, actual: 0 },
    },
  },
  {
    metric: 'Internal Sort Cost',
    category: 'Quality', 
    unit: '$',
    target2025: 50000,
    actual2024: 0,
    monthlyData: {
      'Jan-25': 0,
      'Feb-25': 1269,
      'Mar-25': 0,
      'Apr-25': 0,
      'May-25': 0,
      'Jun-25': 0,
    },
    quarterlyData: {
      q1: { target: 12500, actual: 1269 },
      q2: { target: 12500, actual: 0 },
      q3: { target: 12500, actual: 0 },
      q4: { target: 12500, actual: 0 },
    },
  },
];

export interface MachineDowntime {
  machine: string;
  hourlyRate: number;
  actual2024Hours: number;
  actual2024Cost: number;
  target2025Hours: number;
  target2025Cost: number;
  monthlyHours: {
    [key: string]: number;
  };
  quarterlyCost: {
    q1: { target: number; actual: number };
    q2: { target: number; actual: number };
    q3: { target: number; actual: number };
    q4: { target: number; actual: number };
  };
}

export const machineDowntimeData: MachineDowntime[] = [
  {
    machine: '600-Ton Press',
    hourlyRate: 378,
    actual2024Hours: 303,
    actual2024Cost: 114454,
    target2025Hours: 238,
    target2025Cost: 90000,
    monthlyHours: {
      'Jan-25': 15.2,
      'Feb-25': 18.5,
      'Mar-25': 12.8,
      'Apr-25': 24.3,
      'May-25': 28.1,
      'Jun-25': 31.2,
    },
    quarterlyCost: {
      q1: { target: 22500, actual: 17659 },
      q2: { target: 22500, actual: 32643 },
      q3: { target: 22500, actual: 0 },
      q4: { target: 22500, actual: 0 },
    },
  },
  {
    machine: '1500-1-Ton Press',
    hourlyRate: 900,
    actual2024Hours: 434,
    actual2024Cost: 390243,
    target2025Hours: 347,
    target2025Cost: 312000,
    monthlyHours: {
      'Jan-25': 42.5,
      'Feb-25': 38.2,
      'Mar-25': 40.1,
      'Apr-25': 28.9,
      'May-25': 31.5,
      'Jun-25': 22.8,
    },
    quarterlyCost: {
      q1: { target: 78000, actual: 108783 },
      q2: { target: 78000, actual: 75024 },
      q3: { target: 78000, actual: 0 },
      q4: { target: 78000, actual: 0 },
    },
  },
  {
    machine: '1500-2-Ton Press',
    hourlyRate: 900,
    actual2024Hours: 393,
    actual2024Cost: 353460,
    target2025Hours: 313,
    target2025Cost: 282000,
    monthlyHours: {
      'Jan-25': 45.8,
      'Feb-25': 52.3,
      'Mar-25': 32.4,
      'Apr-25': 48.2,
      'May-25': 51.6,
      'Jun-25': 35.1,
    },
    quarterlyCost: {
      q1: { target: 70500, actual: 117459 },
      q2: { target: 70500, actual: 121077 },
      q3: { target: 70500, actual: 0 },
      q4: { target: 70500, actual: 0 },
    },
  },
  {
    machine: '1400-Ton Press',
    hourlyRate: 840,
    actual2024Hours: 369,
    actual2024Cost: 309845,
    target2025Hours: 294,
    target2025Cost: 247000,
    monthlyHours: {
      'Jan-25': 28.5,
      'Feb-25': 31.2,
      'Mar-25': 31.2,
      'Apr-25': 42.8,
      'May-25': 38.5,
      'Jun-25': 29.2,
    },
    quarterlyCost: {
      q1: { target: 61750, actual: 76338 },
      q2: { target: 61750, actual: 92399 },
      q3: { target: 61750, actual: 0 },
      q4: { target: 61750, actual: 0 },
    },
  },
  {
    machine: '1000-Ton Press',
    hourlyRate: 585,
    actual2024Hours: 179,
    actual2024Cost: 104740,
    target2025Hours: 142,
    target2025Cost: 83000,
    monthlyHours: {
      'Jan-25': 12.5,
      'Feb-25': 11.8,
      'Mar-25': 12.2,
      'Apr-25': 9.8,
      'May-25': 10.5,
      'Jun-25': 8.2,
    },
    quarterlyCost: {
      q1: { target: 20750, actual: 21386 },
      q2: { target: 20750, actual: 16256 },
      q3: { target: 20750, actual: 0 },
      q4: { target: 20750, actual: 0 },
    },
  },
  {
    machine: '3000-Ton Press',
    hourlyRate: 1106,
    actual2024Hours: 542,
    actual2024Cost: 599614,
    target2025Hours: 429,
    target2025Cost: 475000,
    monthlyHours: {
      'Jan-25': 48.5,
      'Feb-25': 52.3,
      'Mar-25': 42.8,
      'Apr-25': 45.2,
      'May-25': 48.8,
      'Jun-25': 42.5,
    },
    quarterlyCost: {
      q1: { target: 118750, actual: 158820 },
      q2: { target: 118750, actual: 150956 },
      q3: { target: 118750, actual: 0 },
      q4: { target: 118750, actual: 0 },
    },
  },
];

export interface MaintenanceMetric {
  category: string;
  monthlyData: {
    [key: string]: {
      hours: number;
      incidents: number;
    };
  };
}

export const maintenanceBreakdown: MaintenanceMetric[] = [
  {
    category: 'Bolster Repairs',
    monthlyData: {
      'Jan-25': { hours: 2.63, incidents: 3 },
      'Feb-25': { hours: 3.12, incidents: 4 },
      'Mar-25': { hours: 3.62, incidents: 5 },
      'Apr-25': { hours: 2.85, incidents: 3 },
      'May-25': { hours: 2.63, incidents: 3 },
      'Jun-25': { hours: 0, incidents: 0 },
    },
  },
  {
    category: 'Press Repairs',
    monthlyData: {
      'Jan-25': { hours: 2.52, incidents: 2 },
      'Feb-25': { hours: 3.45, incidents: 3 },
      'Mar-25': { hours: 2.98, incidents: 3 },
      'Apr-25': { hours: 3.12, incidents: 3 },
      'May-25': { hours: 2.52, incidents: 2 },
      'Jun-25': { hours: 0, incidents: 0 },
    },
  },
  {
    category: 'Transfer System',
    monthlyData: {
      'Jan-25': { hours: 1.93, incidents: 2 },
      'Feb-25': { hours: 2.15, incidents: 2 },
      'Mar-25': { hours: 1.82, incidents: 2 },
      'Apr-25': { hours: 2.35, incidents: 3 },
      'May-25': { hours: 1.93, incidents: 2 },
      'Jun-25': { hours: 0, incidents: 0 },
    },
  },
];

// Executive Summary Calculations
export const getExecutiveSummary = () => {
  const totalScrapSavingsTarget = qualityMetrics[0].actual2024 - qualityMetrics[0].target2025;
  const q1ScrapActual = qualityMetrics[0].quarterlyData.q1.actual;
  const q1ScrapTarget = qualityMetrics[0].quarterlyData.q1.target;
  const q1ScrapVariance = ((q1ScrapActual - q1ScrapTarget) / q1ScrapTarget) * 100;

  const totalDowntime2024 = machineDowntimeData.reduce((sum, m) => sum + m.actual2024Cost, 0);
  const totalDowntimeTarget2025 = machineDowntimeData.reduce((sum, m) => sum + m.target2025Cost, 0);
  const downtimeSavingsTarget = totalDowntime2024 - totalDowntimeTarget2025;

  const q1DowntimeActual = machineDowntimeData.reduce((sum, m) => sum + m.quarterlyCost.q1.actual, 0);
  const q1DowntimeTarget = machineDowntimeData.reduce((sum, m) => sum + m.quarterlyCost.q1.target, 0);

  const pmCompletionTarget = 0.95;
  const pmCompletionQ1 = 0.967;
  const pmCompletionQ2 = 0.975;

  return {
    scrap: {
      annual2024: qualityMetrics[0].actual2024,
      targetSavings: totalScrapSavingsTarget,
      q1Performance: q1ScrapVariance,
      ytdActual: q1ScrapActual + qualityMetrics[0].quarterlyData.q2.actual,
      ytdTarget: q1ScrapTarget + qualityMetrics[0].quarterlyData.q2.target,
    },
    downtime: {
      annual2024: totalDowntime2024,
      targetSavings: downtimeSavingsTarget,
      q1Actual: q1DowntimeActual,
      q1Target: q1DowntimeTarget,
      ytdActual: q1DowntimeActual + machineDowntimeData.reduce((sum, m) => sum + m.quarterlyCost.q2.actual, 0),
    },
    quality: {
      ppm2024: qualityMetrics[2].actual2024,
      ppmTarget: qualityMetrics[2].target2025,
      ppmQ1: qualityMetrics[2].quarterlyData.q1.actual,
      ppmQ2: qualityMetrics[2].quarterlyData.q2.actual,
    },
    maintenance: {
      pmTarget: pmCompletionTarget,
      pmQ1: pmCompletionQ1,
      pmQ2: pmCompletionQ2,
    },
  };
};

// Helper function to get trend direction
export const getTrend = (current: number, previous: number): 'up' | 'down' | 'flat' => {
  const change = ((current - previous) / previous) * 100;
  if (Math.abs(change) < 1) return 'flat';
  return change > 0 ? 'up' : 'down';
};

// Helper function to get status color
export const getStatusColor = (actual: number, target: number, lowerIsBetter: boolean = true): string => {
  const variance = ((actual - target) / target) * 100;
  
  if (lowerIsBetter) {
    if (actual <= target) return 'green';
    if (variance <= 5) return 'yellow';
    return 'red';
  } else {
    if (actual >= target) return 'green';
    if (variance >= -5) return 'yellow';
    return 'red';
  }
};