/**
 * A more advanced, global utility for reliable node preview updates
 * This uses multiple strategies to ensure previews update correctly
 */

// Keep track of preview updates in progress
const updateQueue: Record<string, { 
  url: string, 
  timestamp: number,
  attempts: number
}> = {};

// Maximum attempts to update a node preview
const MAX_ATTEMPTS = 5;

// Interval to check for updates (milliseconds)
const CHECK_INTERVAL = 50;

// Start the update checker if not already running
let checkerRunning = false;

/**
 * Requests a preview update for a specific node from the WebGL renderer
 */
export function requestNodePreview(nodeId: string): void {
  console.log(`Requesting preview update for node: ${nodeId}`);
  
  // Create and dispatch a preview request event
  const requestEvent = new CustomEvent('request-node-preview', {
    detail: { nodeId }
  });
  window.dispatchEvent(requestEvent);
}

/**
 * Directly updates a node preview by manipulating the DOM
 * Returns true if successful, false otherwise
 */
export function updateNodePreviewDirectly(nodeId: string, previewUrl: string): boolean {
  // Add to update queue if not already in progress
  if (!updateQueue[nodeId]) {
    updateQueue[nodeId] = {
      url: previewUrl,
      timestamp: Date.now(),
      attempts: 0
    };
    
    // Start the update checker if not already running
    if (!checkerRunning) {
      startUpdateChecker();
    }
  } else {
    // Update the URL if already in queue
    updateQueue[nodeId].url = previewUrl;
    updateQueue[nodeId].timestamp = Date.now();
  }
  
  // Try immediate update
  return tryDirectUpdate(nodeId, previewUrl);
}

/**
 * Try to directly update the preview image
 */
function tryDirectUpdate(nodeId: string, previewUrl: string): boolean {
  // Find the image element by its data attribute
  const imgElement = document.querySelector(`img[data-node-preview-id="${nodeId}"]`) as HTMLImageElement;
  
  if (imgElement) {
    // Add cache busting to force reload
    const cacheBuster = Date.now();
    const urlWithCache = previewUrl.includes('?') 
      ? `${previewUrl}&_cache=${cacheBuster}` 
      : `${previewUrl}?_cache=${cacheBuster}`;
    
    // Set the src attribute directly
    imgElement.src = urlWithCache;
    console.log(`Successfully updated preview for node ${nodeId}`);
    
    // Remove from queue
    delete updateQueue[nodeId];
    return true;
  }
  
  console.log(`Could not find preview image for node ${nodeId}`);
  return false;
}

/**
 * Start the update checker to handle queued updates
 */
function startUpdateChecker() {
  checkerRunning = true;
  
  const intervalId = setInterval(() => {
    const now = Date.now();
    let hasUpdates = false;
    
    // Process all updates in queue
    Object.keys(updateQueue).forEach(nodeId => {
      const update = updateQueue[nodeId];
      
      // Increase attempt counter
      update.attempts++;
      
      // Try update
      const success = tryDirectUpdate(nodeId, update.url);
      
      // If not successful and not exceeded max attempts, keep in queue
      if (!success && update.attempts < MAX_ATTEMPTS) {
        hasUpdates = true;
      } else {
        // Remove from queue if successful or exceeded max attempts
        delete updateQueue[nodeId];
      }
    });
    
    // Stop checker if no more updates
    if (!hasUpdates) {
      clearInterval(intervalId);
      checkerRunning = false;
    }
  }, CHECK_INTERVAL);
}

// Make functions globally available for debugging
(window as any).requestNodePreview = requestNodePreview;
(window as any).updateNodePreviewDirectly = updateNodePreviewDirectly;