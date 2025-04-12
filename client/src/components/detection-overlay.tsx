import React from 'react';
import { AlertTriangle } from 'lucide-react';

const DetectionOverlay: React.FC = () => {
  return (
    <div className="absolute top-4 right-4 bg-red-600 text-white px-3 py-2 rounded-lg shadow-lg flex items-center">
      <AlertTriangle className="w-5 h-5 mr-2" />
      <span>Exit Blocked!</span>
    </div>
  );
};

export default DetectionOverlay;
