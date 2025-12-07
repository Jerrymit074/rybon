export interface ChannelParams {
  id: string;
  name: string;
  // Saturation parameters (Hill function)
  alpha: number; // Shape: how S-curved it is
  gamma: number; // Scale: amount of spend where saturation is 50%
  coeff: number; // Multiplier: max potential revenue scaling
  color: string;
}

export interface SimulationState {
  spends: Record<string, number>;
  totalBudget: number;
}

export interface SimulationResult {
  channelResults: {
    id: string;
    revenue: number;
    roi: number;
    marginalRoi: number; // ROI of the next dollar spent
  }[];
  totalRevenue: number;
  totalSpend: number;
  totalROI: number;
}

export enum InsightType {
  GENERAL = 'GENERAL',
  CHANNEL_SPECIFIC = 'CHANNEL_SPECIFIC'
}
