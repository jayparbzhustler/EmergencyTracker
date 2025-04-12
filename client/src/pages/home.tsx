import React, { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { LogOut, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import BottomNavigation from '@/components/bottom-navigation';
import FirstRunModal from '@/components/first-run-modal';
import { formatDateTime } from '@/lib/utils';
import { apiRequest } from '@/lib/queryClient';
import { useQuery } from '@tanstack/react-query';
import type { Settings } from '@shared/schema';

export default function Home() {
  const [location, navigate] = useLocation();
  const { toast } = useToast();
  const [showFirstRunModal, setShowFirstRunModal] = useState(false);
  const [isExitClear, setIsExitClear] = useState(false);

  // Check URL parameters for status
  useEffect(() => {
    const params = new URLSearchParams(location.split('?')[1]);
    const status = params.get('status');
    if (status === 'clear') {
      setIsExitClear(true);
      // Show a success toast
      toast({
        title: "Exit Clear",
        description: "The exit has been confirmed as clear and safe",
      });
      
      // Reset the URL without reloading the page
      window.history.replaceState({}, document.title, '/');
      
      // Reset the status after 5 seconds
      setTimeout(() => {
        setIsExitClear(false);
      }, 5000);
    }
  }, [location, toast]);

  // Fetch settings to determine if this is first run
  const { data: settings } = useQuery({
    queryKey: ['/api/settings'],
    onError: () => {
      setShowFirstRunModal(true);
    }
  });

  // Check for first run
  useEffect(() => {
    if (settings && !settings.notificationEmail) {
      setShowFirstRunModal(true);
    }
  }, [settings]);

  // Fetch last scan data
  const { data: lastScan } = useQuery({
    queryKey: ['/api/scans/latest'],
  });

  const handleScanStart = () => {
    navigate('/camera');
  };

  const handleSaveFirstRunEmail = async (email: string) => {
    try {
      await apiRequest('POST', '/api/settings', { notificationEmail: email });
      setShowFirstRunModal(false);
      toast({ 
        title: "Setup Complete", 
        description: "Your notification email has been saved." 
      });
    } catch (error) {
      toast({ 
        title: "Error", 
        description: "Failed to save your settings. Please try again.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className={`flex flex-col h-full ${isExitClear ? 'bg-green-50' : 'bg-[#F5F5F5]'} transition-colors duration-500`}>
      <header className={`${isExitClear ? 'bg-green-600' : 'bg-primary'} text-white p-4 shadow-md transition-colors duration-500`}>
        <h1 className="text-xl font-bold">SafeExit</h1>
        <p className="text-sm opacity-80">Emergency Exit Monitoring System</p>
      </header>
      
      <main className="flex-1 flex flex-col items-center justify-center p-6 space-y-8">
        {isExitClear && (
          <div className="bg-green-100 border-2 border-green-500 rounded-lg p-4 mb-4 flex items-center text-green-800">
            <div className="bg-green-500 rounded-full p-2 mr-3">
              <CheckCircle2 className="h-6 w-6 text-white" />
            </div>
            <div>
              <h3 className="font-bold">Exit Confirmed Clear</h3>
              <p>Great job! The exit is accessible and safe.</p>
            </div>
          </div>
        )}
        
        <div className="text-center mb-6">
          <LogOut className={`w-16 h-16 ${isExitClear ? 'text-green-600' : 'text-primary'} mb-4 mx-auto transition-colors duration-500`} />
          <h2 className="text-xl font-bold mb-2">Emergency Exit Monitoring</h2>
          <p className="text-gray-600">Scan and detect blocked emergency exits in your facility</p>
        </div>
        
        <Button 
          onClick={handleScanStart}
          size="xxl"
          className={`shadow-lg ${isExitClear ? 'bg-green-600 hover:bg-green-700' : ''}`}
        >
          <div className="flex flex-col items-center">
            <span className="material-icons text-5xl mb-2">camera_alt</span>
            <span>Check Exits</span>
          </div>
        </Button>
        
        <div className="flex flex-col items-center text-gray-600 space-y-2">
          <p>Last scan: {lastScan ? formatDateTime(new Date(lastScan.timestamp)) : 'No previous scans'}</p>
          <p className={lastScan && lastScan.blocked ? "text-red-600" : "text-green-600"}>
            {lastScan ? (lastScan.blocked ? "Blocked exit detected" : "All exits clear") : "No scans performed"}
          </p>
        </div>
      </main>
      
      <BottomNavigation 
        currentPage="home"
        onNavigate={(page) => navigate(`/${page === 'home' ? '' : page}`)}
      />
      
      {showFirstRunModal && (
        <FirstRunModal
          onSave={handleSaveFirstRunEmail}
          onClose={() => setShowFirstRunModal(false)}
        />
      )}
    </div>
  );
}
