import React, { useRef, useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { X, Camera, AlertTriangle, CheckCircle2, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import CameraFeed from '@/components/camera-feed';
import DetectionOverlay from '@/components/detection-overlay';
import DetectionModal from '@/components/detection-modal';
import PermissionModal from '@/components/permission-modal';
import WarningOverlay from '@/components/warning-overlay';
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
  const [isScanning, setIsScanning] = useState(false);
  const [showExitOptions, setShowExitOptions] = useState(false);

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
    
    // Show scanning warning
    setIsScanning(true);
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    
    if (!context) {
      setIsScanning(false);
      return;
    }
    
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
      
      // Hide scanning indicator and show options
      setIsScanning(false);
      setShowExitOptions(true);
      
    } catch (error) {
      setIsScanning(false);
      toast({
        title: "Detection Error",
        description: "Failed to analyze image",
        variant: "destructive"
      });
    }
  };
  
  // Handle "Exit is blocked" option
  const handleBlockedExit = () => {
    setShowExitOptions(false);
    setShowDetectionModal(true);
  };
  
  // Handle "Exit is clear" option
  const handleClearExit = () => {
    try {
      if (!capturedImage) return;
      
      // First save the scan with a success handler that will navigate after saving
      const saveAndRedirect = async () => {
        try {
          // Save scan record as clear
          const timestamp = new Date().toISOString();
          await apiRequest('POST', '/api/scans', {
            timestamp,
            blocked: false,
            imageUrl: capturedImage
          });
          
          console.log("Scan saved successfully, redirecting to home");
          
          // Navigate to home with clear status
          window.location.href = '/?status=clear';
        } catch (error) {
          console.error("Error saving scan:", error);
          toast({
            title: "Error",
            description: "Failed to save scan, but redirecting anyway",
            variant: "destructive"
          });
          
          // Even if save fails, still redirect
          window.location.href = '/?status=clear';
        }
      };
      
      // Show feedback to user
      toast({
        title: "Exit Clear",
        description: "The exit has been marked as clear"
      });
      
      // Hide the exit options UI
      setShowExitOptions(false);
      
      // Call the async function to save and redirect
      saveAndRedirect();
      
    } catch (error) {
      console.error("Error in handleClearExit:", error);
      
      // Fallback redirection
      window.location.href = '/?status=clear';
    }
  };

  const sendNotification = () => {
    try {
      if (!capturedImage) return;
      
      // Show feedback to user immediately
      toast({
        title: "Sending Notification",
        description: "Alerting the safety team..."
      });
      
      // First close the modal so UI doesn't freeze
      setShowDetectionModal(false);
      
      // Then process notification and navigate in background
      const processAndNavigate = async () => {
        try {
          const timestamp = new Date().toISOString();
          
          // Send notification first
          await apiRequest('POST', '/api/notifications', {
            image: capturedImage,
            timestamp,
            blocked: true
          });
          
          // Then save scan record
          await apiRequest('POST', '/api/scans', {
            timestamp,
            blocked: true,
            imageUrl: capturedImage
          });
          
          console.log("Notification sent successfully");
          
          // Show success message
          toast({
            title: "Notification Sent",
            description: "The safety team has been notified"
          });
          
          // Redirect to home screen
          window.location.href = '/';
        } catch (error) {
          console.error("Error sending notification:", error);
          
          toast({
            title: "Error",
            description: "Failed to send notification, but returning home",
            variant: "destructive"
          });
          
          // Still redirect to home on error
          window.location.href = '/';
        }
      };
      
      // Start the async process
      processAndNavigate();
      
    } catch (error) {
      console.error("Error in sendNotification:", error);
      
      // Fallback redirection
      setShowDetectionModal(false);
      window.location.href = '/';
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
      
      {isScanning && (
        <WarningOverlay />
      )}
      
      {/* Exit options */}
      {showExitOptions && (
        <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center z-20">
          <div className="text-white text-center mb-8">
            <h2 className="text-2xl font-bold mb-2">Assessment Result</h2>
            <p>Is this exit blocked or clear?</p>
          </div>
          
          <div className="flex space-x-4">
            <Button
              onClick={handleBlockedExit}
              className="w-40 h-16 bg-red-600 hover:bg-red-700 shadow-lg"
              size="lg"
            >
              <XCircle className="h-6 w-6 mr-2" />
              Blocked Exit
            </Button>
            
            <Button
              onClick={handleClearExit}
              className="w-40 h-16 bg-green-600 hover:bg-green-700 shadow-lg"
              size="lg"
            >
              <CheckCircle2 className="h-6 w-6 mr-2" />
              Exit is Clear
            </Button>
          </div>
        </div>
      )}
      
      {/* Camera controls - only show when not scanning or showing options */}
      {!isScanning && !showExitOptions && (
        <div className="absolute bottom-6 left-0 w-full flex justify-center space-x-6">
          <Button 
            onClick={captureImage}
            className="w-16 h-16 rounded-full bg-red-600 hover:bg-red-700 shadow-lg"
            size="xl"
            disabled={isScanning}
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
      )}
      
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
