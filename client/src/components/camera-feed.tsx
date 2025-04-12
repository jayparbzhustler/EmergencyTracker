import React, { useEffect, useState } from 'react';

interface CameraFeedProps {
  videoRef: React.RefObject<HTMLVideoElement>;
  canvasRef: React.RefObject<HTMLCanvasElement>;
  detectionResults: any[] | null;
}

const CameraFeed: React.FC<CameraFeedProps> = ({ 
  videoRef, 
  canvasRef,
  detectionResults 
}) => {
  // Handle video playback
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.addEventListener('loadedmetadata', () => {
        videoRef.current?.play().catch(err => {
          console.error("Error playing video:", err);
        });
      });
    }
  }, [videoRef]);

  // Render detection boxes on overlay canvas
  useEffect(() => {
    if (!detectionResults || !canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Clear previous drawings
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw detection boxes
    detectionResults.forEach(result => {
      const { bbox, class: className, score } = result;
      const [x, y, width, height] = bbox;
      
      // Set style based on object class
      if (className === 'exit_sign') {
        ctx.strokeStyle = '#4CAF50'; // Green for exit signs
      } else if (className === 'obstruction') {
        ctx.strokeStyle = '#D32F2F'; // Red for obstructions
      } else {
        ctx.strokeStyle = '#FFC107'; // Yellow for other objects
      }
      
      ctx.lineWidth = 3;
      ctx.strokeRect(x, y, width, height);
      
      // Add label
      ctx.fillStyle = ctx.strokeStyle;
      ctx.font = '14px Arial';
      ctx.fillText(`${className} ${Math.round(score * 100)}%`, x, y - 5);
    });
  }, [detectionResults]);

  return (
    <div className="relative w-full h-full">
      {/* Video element for camera feed */}
      <video 
        ref={videoRef}
        className="absolute top-0 left-0 w-full h-full object-cover"
        playsInline
        autoPlay
        muted
      />
      
      {/* Canvas overlay for drawing detection boxes */}
      <canvas
        ref={canvasRef}
        className="absolute top-0 left-0 w-full h-full pointer-events-none"
      />
    </div>
  );
};

export default CameraFeed;
