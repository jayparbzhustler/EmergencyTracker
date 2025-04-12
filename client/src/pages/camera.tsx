import React, { useRef, useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { X, Camera, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import CameraFeed from '@/components/camera-feed';
import DetectionOverlay from '@/components/detection-overlay';
import DetectionModal from '@/components/detection-modal';
import PermissionModal from '@/components/permission-modal';
import { useToast } from '@/hooks/use-toast';
import { detectObjects } from '@/lib/object-detection';
import { apiRequest } from '@/lib/queryClient';
import { useQueryClient } from '@tanstack/react-query';

export default function CameraPage() {
  const [, navigate] = useLocation();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [detectionResults, setDetectionResults] = useState<any>(null);
  const [showDetectionModal, setShowDetectionModal] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isBlocked, setIsBlocked] = useState(false);

  // Request camera permission on mount
  useEffect(() => {
    requestCameraPermission();
    return () => {
      // Clean up stream when component unmounts
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const requestCameraPermission = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      setStream(mediaStream);
      setHasPermission(true);
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      console.error("Error accessing camera:", err);
      setHasPermission(false);
    }
  };

  const captureImage = async () => {
    if (!videoRef.current || !canvasRef.current) return;
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    
    if (!context) return;
    
    // Set canvas dimensions to video dimensions
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    // Draw current video frame to canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    // Get image data URL
    const imageDataURL = canvas.toDataURL('image/jpeg');
    setCapturedImage(imageDataURL);
    
    // Run object detection on captured image
    try {
      const results = await detectObjects(canvas);
      
      // Determine if exit is blocked
      const hasExitSign = results.some((obj: any) => obj.class === 'exit_sign');
      const hasObstruction = results.some((obj: any) => obj.class === 'obstruction');
      const isExitBlocked = hasExitSign && hasObstruction;
      
      setDetectionResults(results);
      setIsBlocked(isExitBlocked);
      
      if (isExitBlocked) {
        setShowDetectionModal(true);
      } else {
        toast({
          title: "Scan Complete",
          description: "No blocked exits detected",
        });
      }
    } catch (error) {
      toast({
        title: "Detection Error",
        description: "Failed to analyze image",
        variant: "destructive"
      });
    }
  };

  const sendNotification = async () => {
    try {
      // Send notification with captured image
      if (!capturedImage) return;
      
      const timestamp = new Date().toISOString();
      await apiRequest('POST', '/api/notifications', {
        image: capturedImage,
        timestamp,
        blocked: true
      });
      
      // Save scan record
      await apiRequest('POST', '/api/scans', {
        timestamp,
        blocked: true,
        imageUrl: capturedImage
      });
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/scans/latest'] });
      
      toast({
        title: "Notification Sent",
        description: "The safety team has been notified"
      });
      
      // Close modal and return to home
      setShowDetectionModal(false);
      navigate('/');
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send notification",
        variant: "destructive"
      });
    }
  };

  if (hasPermission === false) {
    return <PermissionModal onRequestPermission={requestCameraPermission} onCancel={() => navigate('/')} />;
  }

  return (
    <div className="relative h-full w-full bg-black">
      <CameraFeed 
        videoRef={videoRef}
        canvasRef={canvasRef}
        detectionResults={detectionResults}
      />
      
      {isBlocked && (
        <DetectionOverlay />
      )}
      
      {/* Camera controls */}
      <div className="absolute bottom-6 left-0 w-full flex justify-center space-x-6">
        <Button 
          onClick={captureImage}
          className="w-16 h-16 rounded-full bg-red-600 hover:bg-red-700 shadow-lg"
          size="xl"
        >
          <Camera className="h-8 w-8" />
        </Button>
        
        <Button
          onClick={() => navigate('/')}
          className="w-12 h-12 rounded-full bg-white text-black hover:bg-gray-100 shadow-lg"
          size="xl"
          variant="outline"
        >
          <X className="h-6 w-6" />
        </Button>
      </div>
      
      {showDetectionModal && (
        <DetectionModal
          imageUrl={capturedImage || ''}
          timestamp={new Date()}
          onSendNotification={sendNotification}
          onClose={() => setShowDetectionModal(false)}
        />
      )}
    </div>
  );
}
