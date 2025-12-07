import { ChannelParams, SimulationResult } from '../types';

// The Hill function is commonly used in MMM to model saturation.
// Revenue = (Spend^Alpha / (Spend^Alpha + Gamma^Alpha)) * MaxPotential
// Simplified for this demo.
export const calculateChannelRevenue = (spend: number, params: ChannelParams): number => {
  const { alpha, gamma, coeff } = params;
  
  if (spend <= 0) return 0;

  // Hill Function
  const saturation = Math.pow(spend, alpha) / (Math.pow(spend, alpha) + Math.pow(gamma, alpha));
  const revenue = saturation * (coeff * gamma); // Scaling factor logic tailored for demo visuals

  return revenue;
};

export const calculateMarginalROI = (spend: number, params: ChannelParams): number => {
  const currentRev = calculateChannelRevenue(spend, params);
  const nextRev = calculateChannelRevenue(spend + 100, params); // Look ahead $100
  return (nextRev - currentRev) / 100;
};

export const runSimulation = (
  spends: Record<string, number>,
  channels: ChannelParams[]
): SimulationResult => {
  let totalRevenue = 0;
  let totalSpend = 0;
  
  const channelResults = channels.map((channel) => {
    const spend = spends[channel.id] || 0;
    const revenue = calculateChannelRevenue(spend, channel);
    const roi = spend > 0 ? revenue / spend : 0;
    const marginalRoi = calculateMarginalROI(spend, channel);

    totalRevenue += revenue;
    totalSpend += spend;

    return {
      id: channel.id,
      revenue,
      roi,
      marginalRoi
    };
  });

  const totalROI = totalSpend > 0 ? totalRevenue / totalSpend : 0;

  return {
    channelResults,
    totalRevenue,
    totalSpend,
    totalROI
  };
};

// Generate data points for plotting the curve
export const generateCurveData = (channel: ChannelParams, maxSpend: number) => {
  const points = [];
  const steps = 20;
  const stepSize = maxSpend / steps;
  
  for (let i = 0; i <= steps + 5; i++) { // Go a bit past max spend
    const x = i * stepSize;
    const y = calculateChannelRevenue(x, channel);
    points.push({ spend: x, revenue: y });
  }
  return points;
};
