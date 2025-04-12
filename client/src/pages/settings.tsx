import React from 'react';
import { useLocation } from 'wouter';
import { ArrowLeft, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import SettingsForm from '@/components/settings-form';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

export default function Settings() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch current settings
  const { data: settings, isLoading } = useQuery({
    queryKey: ['/api/settings'],
  });

  // Update settings mutation
  const updateSettings = useMutation({
    mutationFn: (newSettings: any) => apiRequest('POST', '/api/settings', newSettings),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/settings'] });
      toast({
        title: "Settings saved",
        description: "Your notification settings have been updated"
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to save settings",
        variant: "destructive"
      });
    }
  });

  const handleSaveSettings = (formData: any) => {
    updateSettings.mutate(formData);
  };

  return (
    <div className="flex flex-col h-full bg-[#F5F5F5]">
      <header className="bg-primary text-white p-4 flex items-center shadow-md">
        <Button 
          variant="ghost" 
          size="icon" 
          className="mr-4 text-white hover:bg-primary-dark" 
          onClick={() => navigate('/')}
        >
          <ArrowLeft className="h-6 w-6" />
        </Button>
        <h1 className="text-xl font-bold">Settings</h1>
      </header>
      
      <main className="p-6 space-y-6 flex-1 overflow-auto">
        <section className="bg-white rounded-lg shadow-sm p-4">
          <h2 className="text-lg font-medium mb-4">Notification Settings</h2>
          
          {isLoading ? (
            <div className="p-4 text-center">Loading settings...</div>
          ) : (
            <SettingsForm 
              initialSettings={settings}
              onSubmit={handleSaveSettings}
              isPending={updateSettings.isPending}
            />
          )}
        </section>
        
        <section className="bg-white rounded-lg shadow-sm p-4">
          <h2 className="text-lg font-medium mb-4">Detection Settings</h2>
          
          <div className="mb-4">
            <label className="block text-gray-600 mb-2">Detection Sensitivity</label>
            <input 
              type="range" 
              min="1" 
              max="5" 
              value={settings?.sensitivity || 3} 
              onChange={(e) => {
                updateSettings.mutate({
                  ...settings,
                  sensitivity: parseInt(e.target.value)
                });
              }}
              className="w-full accent-primary"
            />
            <div className="flex justify-between text-xs text-gray-600 mt-1">
              <span>Low</span>
              <span>High</span>
            </div>
          </div>
        </section>
        
        <section className="bg-white rounded-lg shadow-sm p-4">
          <h2 className="text-lg font-medium mb-4">About</h2>
          <p className="text-gray-600">SafeExit v1.0.0</p>
          <p className="text-gray-600 text-sm mt-2">
            This application helps ensure emergency exits remain unblocked
            to comply with safety regulations.
          </p>
        </section>
      </main>
    </div>
  );
}
