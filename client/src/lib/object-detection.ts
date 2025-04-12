import * as tf from '@tensorflow/tfjs';

// Initialize model - will load when first detection is requested
let model: tf.GraphModel | null = null;

// Object classes that can be detected
const CLASSES = [
  'background',
  'exit_sign',
  'obstruction',
  'box',
  'pallet',
  'machinery'
];

// Function to load the model if not already loaded
async function loadModel() {
  if (!model) {
    try {
      // Load model from TensorFlow Hub
      // Using a pre-trained SSD MobileNet for object detection
      model = await tf.loadGraphModel(
        'https://tfhub.dev/tensorflow/ssd_mobilenet_v2/2',
        { fromTFHub: true }
      );
      console.log('Model loaded successfully');
    } catch (error) {
      console.error('Failed to load model:', error);
      throw new Error('Failed to load object detection model');
    }
  }
  return model;
}

// Main detection function
export async function detectObjects(canvas: HTMLCanvasElement) {
  // Ensure model is loaded
  const detectionModel = await loadModel();
  
  // Get image data from canvas
  const imageData = tf.browser.fromPixels(canvas);
  
  // Preprocessing - resize and normalize
  const input = tf.image.resizeBilinear(imageData, [300, 300])
    .div(255.0)
    .expandDims(0);
  
  // Perform detection
  const result = await detectionModel.executeAsync(input) as tf.Tensor[];
  
  // Process results
  const boxes = await result[1].dataSync();
  const scores = await result[2].dataSync();
  const classes = await result[5].dataSync();
  
  // Clean up tensors
  tf.dispose(result);
  tf.dispose(input);
  tf.dispose(imageData);
  
  // Prepare results array
  const detections = [];
  
  // Map detected objects to our CLASSES
  for (let i = 0; i < scores.length; i++) {
    // Only include detections with confidence above 0.5
    if (scores[i] > 0.5) {
      // Map class index to our application classes
      let classIndex = Math.min(parseInt(classes[i].toString()), CLASSES.length - 1);
      let className = CLASSES[classIndex];
      
      // Map certain types of obstructions to the generic "obstruction" class
      if (['box', 'pallet', 'machinery'].includes(className)) {
        className = 'obstruction';
      }
      
      // Extract bounding box
      const [y1, x1, y2, x2] = [
        boxes[i * 4] * canvas.height,
        boxes[i * 4 + 1] * canvas.width,
        boxes[i * 4 + 2] * canvas.height,
        boxes[i * 4 + 3] * canvas.width,
      ];
      
      detections.push({
        class: className,
        score: scores[i],
        bbox: [x1, y1, x2 - x1, y2 - y1]
      });
    }
  }
  
  // Determine if an exit is blocked by checking for overlaps
  const exitSigns = detections.filter(d => d.class === 'exit_sign');
  const obstructions = detections.filter(d => d.class === 'obstruction');
  
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
  
  return detections;
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
