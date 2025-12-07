import React from 'react';
import { Info } from 'lucide-react';

interface MetricCardProps {
  label: string;
  value: string | number;
  subValue?: string;
  trend?: 'up' | 'down' | 'neutral';
  onExplain: () => void;
  highlight?: boolean;
}

export const MetricCard: React.FC<MetricCardProps> = ({ 
  label, 
  value, 
  subValue, 
  trend, 
  onExplain, 
  highlight 
}) => {
  return (
    <div className={`relative p-5 rounded-xl border shadow-sm transition-all duration-200 ${highlight ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-white border-gray-200 hover:border-indigo-300'}`}>
      <div className="flex justify-between items-start mb-2">
        <h3 className={`text-sm font-medium uppercase tracking-wider ${highlight ? 'text-indigo-100' : 'text-gray-500'}`}>{label}</h3>
        <button 
          onClick={(e) => { e.stopPropagation(); onExplain(); }}
          className={`p-1 rounded-full transition-colors ${highlight ? 'hover:bg-indigo-500 text-indigo-200' : 'hover:bg-gray-100 text-gray-400'}`}
          aria-label="Explain this metric"
        >
          <Info size={18} />
        </button>
      </div>
      
      <div className="flex items-baseline gap-2">
        <span className="text-3xl font-bold">{value}</span>
        {subValue && (
          <span className={`text-sm font-medium ${
            highlight ? 'text-indigo-200' : 
            trend === 'up' ? 'text-green-600' : 
            trend === 'down' ? 'text-red-600' : 'text-gray-500'
          }`}>
            {subValue}
          </span>
        )}
      </div>
    </div>
  );
};
