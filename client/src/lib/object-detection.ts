import * as tf from '@tensorflow/tfjs';
import * as cocoSsd from '@tensorflow-models/coco-ssd';

// Define our detection types
interface Detection {
  class: string;
  score: number;
  bbox: number[];
  originalClass?: string;
  isBlocked?: boolean;
  isBlocking?: boolean;
}

// Initialize model - will load when first detection is requested
let model: cocoSsd.ObjectDetection | null = null;

// Exit sign and obstruction classes for our application
const EXIT_SIGN_CLASSES = ['door', 'exit sign', 'sign'];
const OBSTRUCTION_CLASSES = ['person', 'bicycle', 'car', 'motorcycle', 'bus', 'truck', 'chair', 
                          'couch', 'bed', 'dining table', 'toilet', 'tv', 'laptop', 'suitcase',
                          'backpack', 'handbag', 'sports ball', 'kite', 'skateboard'];

// Function to load the model if not already loaded
async function loadModel(): Promise<cocoSsd.ObjectDetection> {
  if (!model) {
    try {
      // Load COCO-SSD model
      model = await cocoSsd.load();
      console.log('Model loaded successfully');
    } catch (error) {
      console.error('Failed to load model:', error);
      throw new Error('Failed to load object detection model');
    }
  }
  return model;
}

// Main detection function
export async function detectObjects(canvas: HTMLCanvasElement): Promise<Detection[]> {
  try {
    // Ensure model is loaded
    const detectionModel = await loadModel();
    
    if (!detectionModel) {
      console.error('Model failed to load');
      return [];
    }
    
    // Perform detection directly on the canvas element
    const predictions = await detectionModel.detect(canvas);
    
    // Map COCO-SSD predictions to our application's format
    const detections: Detection[] = predictions.map(prediction => {
      // Determine if this is an exit sign or obstruction based on class
      let mappedClass = 'unknown';
      
      if (EXIT_SIGN_CLASSES.includes(prediction.class.toLowerCase())) {
        mappedClass = 'exit_sign';
      } else if (OBSTRUCTION_CLASSES.includes(prediction.class.toLowerCase())) {
        mappedClass = 'obstruction';
      }
      
      // Extract bounding box [x, y, width, height]
      const [x, y, width, height] = prediction.bbox;
      
      return {
        class: mappedClass,
        score: prediction.score,
        bbox: [x, y, width, height],
        originalClass: prediction.class,
        isBlocked: false,
        isBlocking: false
      };
    });
    
    // Filter out unknown classes
    const filteredDetections = detections.filter(d => d.class !== 'unknown');
    
    // Determine if an exit is blocked by checking for overlaps
    const exitSigns = filteredDetections.filter(d => d.class === 'exit_sign');
    const obstructions = filteredDetections.filter(d => d.class === 'obstruction');
    
    // Check for overlaps between exit signs and obstructions
    for (const exit of exitSigns) {
      for (const obstruction of obstructions) {
        if (checkOverlap(exit.bbox, obstruction.bbox)) {
          // Add a flag to both objects indicating they're part of a blocked exit
          exit.isBlocked = true;
          obstruction.isBlocking = true;
        }
      }
    }
    
    return filteredDetections;
  } catch (error) {
    console.error('Detection error:', error);
    return [];
  }
}

// Helper function to check if two bounding boxes overlap
function checkOverlap(box1: number[], box2: number[]) {
  // box format: [x, y, width, height]
  const [x1, y1, w1, h1] = box1;
  const [x2, y2, w2, h2] = box2;
  
  // Calculate the right and bottom coordinates
  const right1 = x1 + w1;
  const bottom1 = y1 + h1;
  const right2 = x2 + w2;
  const bottom2 = y2 + h2;
  
  // Check for overlap conditions
  // No overlap if one box is to the left/right/top/bottom of the other
  if (right1 < x2 || right2 < x1 || bottom1 < y2 || bottom2 < y1) {
    return false;
  }
  
  // Calculate overlap area ratio to determine significant overlap
  const overlapWidth = Math.min(right1, right2) - Math.max(x1, x2);
  const overlapHeight = Math.min(bottom1, bottom2) - Math.max(y1, y2);
  const overlapArea = overlapWidth * overlapHeight;
  
  // Determine if there's significant overlap (at least 20%)
  const area1 = w1 * h1;
  const area2 = w2 * h2;
  const smallerArea = Math.min(area1, area2);
  
  return (overlapArea / smallerArea) >= 0.2;
}
