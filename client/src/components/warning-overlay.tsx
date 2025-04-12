import React from 'react';
import { AlertTriangle } from 'lucide-react';

const WarningOverlay: React.FC = () => {
  return (
    <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center pointer-events-none">
      <div className="flex flex-col items-center">
        <div className="bg-amber-500 rounded-full p-3 mb-3 animate-pulse">
          <AlertTriangle className="h-8 w-8 text-white" />
        </div>
        <div className="bg-black/70 text-white px-4 py-2 rounded-lg text-center">
          <p className="font-bold text-lg">SCANNING</p>
          <p className="text-sm">Analyzing for blocked exits</p>
        </div>
      </div>
    </div>
  );
};

export default WarningOverlay;