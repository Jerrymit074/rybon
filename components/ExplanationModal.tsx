import React from 'react';
import { X } from 'lucide-react';

interface ExplanationModalProps {
  title: string;
  description: string;
  isOpen: boolean;
  onClose: () => void;
  geminiInsight?: string;
  isLoadingAi?: boolean;
}

export const ExplanationModal: React.FC<ExplanationModalProps> = ({ 
  title, 
  description, 
  isOpen, 
  onClose,
  geminiInsight,
  isLoadingAi
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full overflow-hidden animate-fade-in">
        <div className="bg-indigo-600 p-4 flex justify-between items-center">
          <h3 className="text-white text-lg font-bold">{title}</h3>
          <button onClick={onClose} className="text-white hover:text-indigo-200">
            <X size={24} />
          </button>
        </div>
        
        <div className="p-6 space-y-4">
          <div>
            <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-1">Definition</h4>
            <p className="text-gray-800 text-lg leading-relaxed">{description}</p>
          </div>

          <div className="bg-indigo-50 border-l-4 border-indigo-500 p-4 rounded-r-md">
            <h4 className="text-sm font-semibold text-indigo-900 uppercase tracking-wide mb-2 flex items-center gap-2">
              <span>✨ Smart Insight</span>
              {isLoadingAi && <span className="text-xs font-normal normal-case animate-pulse">(Analyzing...)</span>}
            </h4>
            <p className="text-indigo-800 text-md">
              {isLoadingAi ? "Consulting the data strategy AI..." : (geminiInsight || "No specific insights available at the moment.")}
            </p>
          </div>
        </div>

        <div className="bg-gray-50 p-4 flex justify-end">
          <button 
            onClick={onClose}
            className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
};
