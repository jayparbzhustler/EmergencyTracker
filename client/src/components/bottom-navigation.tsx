import React from 'react';
import { Home, History, Settings } from 'lucide-react';

interface BottomNavigationProps {
  currentPage: string;
  onNavigate: (page: string) => void;
}

const BottomNavigation: React.FC<BottomNavigationProps> = ({
  currentPage,
  onNavigate
}) => {
  return (
    <footer className="bg-white p-4 border-t border-gray-200">
      <nav className="flex justify-around items-center">
        <button 
          className={`flex flex-col items-center ${currentPage === 'home' ? 'text-primary' : 'text-gray-500'}`}
          onClick={() => onNavigate('home')}
        >
          <Home className="h-6 w-6" />
          <span className="text-xs mt-1">Home</span>
        </button>
        
        <button 
          className={`flex flex-col items-center ${currentPage === 'history' ? 'text-primary' : 'text-gray-500'}`}
          onClick={() => onNavigate('history')}
        >
          <History className="h-6 w-6" />
          <span className="text-xs mt-1">History</span>
        </button>
        
        <button 
          className={`flex flex-col items-center ${currentPage === 'settings' ? 'text-primary' : 'text-gray-500'}`}
          onClick={() => onNavigate('settings')}
        >
          <Settings className="h-6 w-6" />
          <span className="text-xs mt-1">Settings</span>
        </button>
      </nav>
    </footer>
  );
};

export default BottomNavigation;
