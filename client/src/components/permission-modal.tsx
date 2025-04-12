import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Camera } from 'lucide-react';

interface PermissionModalProps {
  onRequestPermission: () => void;
  onCancel: () => void;
}

const PermissionModal: React.FC<PermissionModalProps> = ({
  onRequestPermission,
  onCancel
}) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-5/6 max-w-md overflow-hidden">
        <div className="p-4 bg-primary text-white">
          <h3 className="text-lg font-bold">Camera Permission Required</h3>
        </div>
        
        <div className="p-6">
          <div className="text-center mb-6">
            <Camera className="h-16 w-16 text-primary mb-4 mx-auto" />
            <p className="text-gray-900 mb-2">
              This app needs camera permission to detect blocked emergency exits.
            </p>
          </div>
          
          <Button 
            className="w-full mb-3"
            onClick={onRequestPermission}
          >
            Allow Camera Access
          </Button>
          
          <Button 
            className="w-full bg-gray-200 hover:bg-gray-300 text-gray-900"
            variant="secondary"
            onClick={onCancel}
          >
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PermissionModal;
