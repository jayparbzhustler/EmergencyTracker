import React, { useEffect, useState } from 'react';
import { CheckCircle } from 'lucide-react';

interface NotificationToastProps {
  message: string;
  duration?: number;
  onClose?: () => void;
}

const NotificationToast: React.FC<NotificationToastProps> = ({
  message,
  duration = 3000,
  onClose
}) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      if (onClose) onClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-20 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white px-4 py-3 rounded-lg shadow-lg flex items-center z-50 animate-fade-in">
      <CheckCircle className="w-5 h-5 mr-2" />
      <span>{message}</span>
    </div>
  );
};

export default NotificationToast;
