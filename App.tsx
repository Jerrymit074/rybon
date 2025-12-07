import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, BarChart, Bar, Cell, ReferenceLine, ComposedChart, Line } from 'recharts';
import { Settings, TrendingUp, DollarSign, PieChart, Activity, RefreshCw } from 'lucide-react';
import { ChannelParams, SimulationResult } from './types';
import { runSimulation, generateCurveData } from './utils/robynMath';
import { generateBusinessInsight } from './services/gemini';
import { MetricCard } from './components/MetricCard';
import { ExplanationModal } from './components/ExplanationModal';

// --- Constants & Config ---
const CHANNELS: ChannelParams[] = [
  { id: 'fb', name: 'Facebook Ads', alpha: 1.8, gamma: 40000, coeff: 2.5, color: '#1877F2' },
  { id: 'tv', name: 'TV Commercials', alpha: 0.9, gamma: 150000, coeff: 1.8, color: '#8B5CF6' },
  { id: 'search', name: 'Google Search', alpha: 1.2, gamma: 25000, coeff: 3.5, color: '#EA4335' },
  { id: 'print', name: 'Print / OOH', alpha: 2.5, gamma: 60000, coeff: 1.2, color: '#10B981' },
];

const INITIAL_BUDGET = 100000;
const MAX_CHANNEL_SPEND = 150000;

const App: React.FC = () => {
  // State
  const [spends, setSpends] = useState<Record<string, number>>({
    fb: 30000,
    tv: 50000,
    search: 15000,
    print: 5000
  });

  const [result, setResult] = useState<SimulationResult | null>(null);
  const [activeChannelId, setActiveChannelId] = useState<string>('fb'); // For curve visualization
  const [explanation, setExplanation] = useState<{ title: string; desc: string; type: string } | null>(null);
  const [aiInsight, setAiInsight] = useState<string>('');
  const [loadingAi, setLoadingAi] = useState<boolean>(false);

  // Derived Values
  const activeChannel = useMemo(() => CHANNELS.find(c => c.id === activeChannelId) || CHANNELS[0], [activeChannelId]);
  
  // Simulation Logic
  useEffect(() => {
    const res = runSimulation(spends, CHANNELS);
    setResult(res);
  }, [spends]);

  // Handle Input Changes
  const handleSpendChange = (id: string, val: number) => {
    setSpends(prev => ({ ...prev, [id]: val }));
    setActiveChannelId(id); // Auto switch view to the edited channel
  };

  // Explanation Handlers
  const handleExplain = useCallback(async (type: string, title: string, desc: string, channelId?: string) => {
    setExplanation({ title, desc, type });
    setLoadingAi(true);
    setAiInsight('');
    
    // Call Gemini
    if (result) {
      const insight = await generateBusinessInsight(result, CHANNELS, channelId || null);
      setAiInsight(insight);
    }
    setLoadingAi(false);
  }, [result]);

  // Chart Data Preparation
  const barData = useMemo(() => {
    if (!result) return [];
    return result.channelResults.map(r => {
      const ch = CHANNELS.find(c => c.id === r.id);
      return {
        name: ch?.name || r.id,
        spend: spends[r.id],
        revenue: r.revenue,
        roi: r.roi,
        color: ch?.color
      };
    });
  }, [result, spends]);

  const curveData = useMemo(() => {
    return generateCurveData(activeChannel, MAX_CHANNEL_SPEND);
  }, [activeChannel]);

  const currentPoint = useMemo(() => {
    if (!result) return { spend: 0, revenue: 0 };
    const r = result.channelResults.find(res => res.id === activeChannel.id);
    return { spend: spends[activeChannel.id], revenue: r?.revenue || 0 };
  }, [result, activeChannel, spends]);

  if (!result) return <div>Loading Simulator...</div>;

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 pb-20">
      
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-indigo-600 text-white p-2 rounded-lg">
              <Activity size={20} />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-gray-900">Robyn <span className="text-indigo-600 font-light">Commercial Simulator</span></h1>
          </div>
          <div className="flex items-center gap-4 text-sm text-gray-500">
            <span className="hidden sm:inline">Powered by Marketing Mix Modeling Logic</span>
            <button 
              onClick={() => handleExplain('GENERAL', 'Business Overview', 'This summary analyzes your entire budget allocation effectiveness.')}
              className="flex items-center gap-1 bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-md transition-colors text-indigo-700 font-medium"
            >
              <RefreshCw size={14} />
              <span>Ask AI Strategist</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* Top Level KPIs */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <MetricCard 
            label="Total Forecasted Revenue" 
            value={`$${Math.round(result.totalRevenue).toLocaleString()}`} 
            subValue="Expected Return"
            trend="up"
            highlight
            onExplain={() => handleExplain('REVENUE', 'Total Revenue Forecast', 'This is the predicted amount of money your business will generate based on the current marketing spend mix. It is calculated by summing up the contribution of each channel according to its unique performance curve.')}
          />
          <MetricCard 
            label="Total Spend" 
            value={`$${result.totalSpend.toLocaleString()}`} 
            subValue="Budget Used"
            onExplain={() => handleExplain('SPEND', 'Total Budget Allocation', 'The total amount of capital deployed across all channels. Keep an eye on this to ensure you stay within your quarterly limits.')}
          />
          <MetricCard 
            label="Overall ROAS" 
            value={`${result.totalROI.toFixed(2)}x`} 
            subValue={result.totalROI < 1.5 ? "Inefficient" : result.totalROI > 4 ? "High Efficiency" : "Healthy"}
            trend={result.totalROI > 3 ? 'up' : result.totalROI < 1.5 ? 'down' : 'neutral'}
            onExplain={() => handleExplain('ROAS', 'Return on Ad Spend (ROAS)', 'For every $1 you put into the machine, this is how many dollars you get back. A ROAS of 3.0x means you triple your money. If this drops too low, you are wasting cash.')}
          />
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Column: Controls & Channel Breakdown */}
          <div className="lg:col-span-5 space-y-8">
            
            {/* Budget Allocator */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold flex items-center gap-2">
                  <Settings size={20} className="text-gray-400" />
                  Budget Allocator
                </h2>
                <span className="text-xs font-semibold bg-gray-100 px-2 py-1 rounded text-gray-500">Interactive</span>
              </div>
              
              <div className="space-y-6">
                {CHANNELS.map(channel => (
                  <div key={channel.id} className="relative">
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full" style={{ backgroundColor: channel.color }}></span>
                        {channel.name}
                      </label>
                      <span className="text-sm font-mono text-gray-600">${spends[channel.id].toLocaleString()}</span>
                    </div>
                    <input 
                      type="range" 
                      min="0" 
                      max={MAX_CHANNEL_SPEND} 
                      step="1000"
                      value={spends[channel.id]}
                      onChange={(e) => handleSpendChange(channel.id, parseInt(e.target.value))}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600 hover:accent-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                    />
                    {/* Mini Insight */}
                    <div className="flex justify-between text-xs mt-1 text-gray-400">
                      <span>ROI: {result.channelResults.find(r => r.id === channel.id)?.roi.toFixed(1)}x</span>
                      <button 
                        className="hover:text-indigo-600 underline"
                        onClick={() => handleExplain('CHANNEL', `${channel.name} Performance`, `Analyzing the efficiency of ${channel.name}. The ROI figure tells you the current efficiency. If ROI is low, you might be oversaturated (spending too much).`, channel.id)}
                      >
                        Why this number?
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Bar Chart Summary */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
               <h2 className="text-lg font-bold flex items-center gap-2 mb-6">
                  <PieChart size={20} className="text-gray-400" />
                  Contribution by Channel
                </h2>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={barData} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e5e7eb" />
                      <XAxis type="number" hide />
                      <YAxis type="category" dataKey="name" width={100} tick={{fontSize: 12}} />
                      <RechartsTooltip 
                        formatter={(value: number, name: string) => [`$${value.toLocaleString()}`, name === 'revenue' ? 'Revenue' : 'Spend']}
                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                      />
                      <Bar dataKey="spend" stackId="a" fill="#E5E7EB" radius={[0, 4, 4, 0]} barSize={20} name="Cost" />
                      <Bar dataKey="revenue" stackId="b" radius={[0, 4, 4, 0]} barSize={20} name="Return">
                        {barData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <p className="text-xs text-center text-gray-400 mt-2">Colored bars = Revenue generated. Gray bars = Cost incurred.</p>
            </div>

          </div>

          {/* Right Column: Deep Dive & Visualizer */}
          <div className="lg:col-span-7 space-y-8">
            
            {/* The Curve Visualizer */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex flex-col h-full min-h-[500px]">
              <div className="flex items-center justify-between mb-2">
                <div>
                   <h2 className="text-lg font-bold flex items-center gap-2">
                    <TrendingUp size={20} className="text-gray-400" />
                    Saturation Curve: {activeChannel.name}
                  </h2>
                  <p className="text-sm text-gray-500">Visualizing diminishing returns (The "Hill Function")</p>
                </div>
                <select 
                  className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block p-2.5"
                  value={activeChannelId}
                  onChange={(e) => setActiveChannelId(e.target.value)}
                >
                  {CHANNELS.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>

              <div className="flex-1 w-full mt-4 relative">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={curveData} margin={{ top: 20, right: 20, left: 0, bottom: 20 }}>
                    <defs>
                      <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={activeChannel.color} stopOpacity={0.1}/>
                        <stop offset="95%" stopColor={activeChannel.color} stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                    <XAxis 
                      dataKey="spend" 
                      tickFormatter={(val) => `$${val/1000}k`} 
                      label={{ value: 'Spend Amount', position: 'bottom', offset: 0, fontSize: 12 }} 
                      tick={{fontSize: 12, fill: '#9CA3AF'}}
                    />
                    <YAxis 
                      tickFormatter={(val) => `$${val/1000}k`} 
                      label={{ value: 'Revenue Return', angle: -90, position: 'insideLeft', fontSize: 12 }} 
                      tick={{fontSize: 12, fill: '#9CA3AF'}}
                    />
                    <RechartsTooltip 
                       formatter={(value: number) => [`$${Math.round(value).toLocaleString()}`, 'Revenue']}
                       labelFormatter={(label) => `Spend: $${Math.round(label).toLocaleString()}`}
                       contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="revenue" 
                      stroke={activeChannel.color} 
                      fillOpacity={1} 
                      fill="url(#colorRevenue)" 
                      strokeWidth={3}
                    />
                    {/* Current Position Marker */}
                    <ReferenceLine x={currentPoint.spend} stroke="#374151" strokeDasharray="3 3" />
                    <ReferenceLine y={currentPoint.revenue} stroke="#374151" strokeDasharray="3 3" />
                  </AreaChart>
                </ResponsiveContainer>
                
                {/* Overlay annotation for the boss */}
                <div className="absolute top-4 right-4 bg-white/90 backdrop-blur border border-gray-200 p-3 rounded-lg shadow-sm max-w-xs text-sm">
                  <div className="font-semibold text-gray-800 mb-1">Your current position</div>
                  <div className="flex justify-between gap-4 mb-1">
                    <span className="text-gray-500">Spending:</span>
                    <span className="font-mono font-bold">${currentPoint.spend.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span className="text-gray-500">Making:</span>
                    <span className="font-mono font-bold text-green-600">${Math.round(currentPoint.revenue).toLocaleString()}</span>
                  </div>
                  <div className="mt-2 text-xs text-gray-500 italic border-t pt-2">
                    {/* Dynamic text based on slope could go here, but keep it simple */}
                    This curve shows "Diminishing Returns". The flatter the line gets, the more money you are wasting by adding budget.
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Logic Explainer */}
            <div className="grid grid-cols-2 gap-6">
                <div 
                  className="bg-indigo-50 p-6 rounded-xl border border-indigo-100 cursor-pointer hover:bg-indigo-100 transition-colors group"
                  onClick={() => handleExplain('SATURATION', 'Saturation (Diminishing Returns)', 'Imagine squeezing a lemon. The first squeeze gives lots of juice. The harder you squeeze (spend more), the less extra juice you get. Eventually, spending more does almost nothing. That is Saturation.')}
                >
                   <h3 className="text-indigo-900 font-bold mb-2 group-hover:underline decoration-indigo-400 underline-offset-4">What is Saturation?</h3>
                   <p className="text-indigo-700 text-sm">Why spending 2x doesn't always equal 2x revenue.</p>
                </div>
                <div 
                  className="bg-green-50 p-6 rounded-xl border border-green-100 cursor-pointer hover:bg-green-100 transition-colors group"
                  onClick={() => handleExplain('ADSTOCK', 'Adstock (Memory Effect)', 'Ads stick in people\'s heads. Money you spent last week still affects sales today. This delay effect is called Adstock. We calculate this so you don\'t credit today\'s sales solely to today\'s spend.')}
                >
                   <h3 className="text-green-900 font-bold mb-2 group-hover:underline decoration-green-400 underline-offset-4">What is Adstock?</h3>
                   <p className="text-green-700 text-sm">How long customers remember your ads.</p>
                </div>
            </div>

          </div>
        </div>
      </main>

      <ExplanationModal 
        isOpen={!!explanation}
        onClose={() => setExplanation(null)}
        title={explanation?.title || ''}
        description={explanation?.desc || ''}
        geminiInsight={aiInsight}
        isLoadingAi={loadingAi}
      />

    </div>
  );
};

export default App;
