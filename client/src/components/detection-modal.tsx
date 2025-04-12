import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Send } from 'lucide-react';
import { formatDateTime } from '@/lib/utils';

interface DetectionModalProps {
  imageUrl: string;
  timestamp: Date;
  onSendNotification: () => void;
  onClose: () => void;
}

const DetectionModal: React.FC<DetectionModalProps> = ({
  imageUrl,
  timestamp,
  onSendNotification,
  onClose
}) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-5/6 max-w-md overflow-hidden">
        <div className="p-4 bg-red-600 text-white">
          <h3 className="text-lg font-bold">Emergency Exit Blocked!</h3>
        </div>
        
        <div className="p-6">
          <div className="aspect-w-4 aspect-h-3 mb-4 bg-gray-200 rounded overflow-hidden">
            <img 
              src={imageUrl} 
              alt="Blocked emergency exit" 
              className="object-cover w-full"
            />
          </div>
          
          <div className="mb-4">
            <p className="text-gray-900 mb-2">
              <strong>Date & Time:</strong> {formatDateTime(timestamp)}
            </p>
            <p className="text-gray-900">
              <strong>Status:</strong> 
              <span className="text-red-600 font-medium"> Exit blocked by obstruction</span>
            </p>
          </div>
          
          <div className="flex flex-col space-y-3">
            <Button 
              className="w-full bg-red-600 hover:bg-red-700 text-white"
              onClick={onSendNotification}
            >
              <Send className="mr-2 h-4 w-4" />
              Send Notification
            </Button>
            
            <Button 
              className="w-full bg-gray-200 hover:bg-gray-300 text-gray-900"
              variant="secondary"
              onClick={onClose}
            >
              Continue Scanning
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DetectionModal;
