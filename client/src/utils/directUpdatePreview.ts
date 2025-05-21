/**
 * Directly updates a node's preview image, bypassing React
 * This function finds the image element by data attribute and forces it to update
 */
export function updateNodePreviewDirectly(nodeId: string, previewUrl: string): boolean {
  // Find the image element by its data attribute
  const imgElement = document.querySelector(`img[data-node-preview-id="${nodeId}"]`) as HTMLImageElement;
  
  if (imgElement) {
    console.log(`Directly updating preview for node ${nodeId}`);
    
    // Add cache busting to ensure the browser loads the new image
    const cacheBuster = `?t=${Date.now()}`;
    const urlWithCacheBuster = previewUrl.includes('?') 
      ? `${previewUrl}&_cache=${Date.now()}` 
      : `${previewUrl}?_cache=${Date.now()}`;
    
    // Set the src attribute directly
    imgElement.src = urlWithCacheBuster;
    
    return true;
  }
  
  // Try to find the image after a brief delay - the element might not be in the DOM yet
  setTimeout(() => {
    const retryImgElement = document.querySelector(`img[data-node-preview-id="${nodeId}"]`) as HTMLImageElement;
    if (retryImgElement) {
      console.log(`Found preview image for node ${nodeId} on second attempt`);
      
      // Add cache busting 
      const urlWithCacheBuster = previewUrl.includes('?') 
        ? `${previewUrl}&_cache=${Date.now()}` 
        : `${previewUrl}?_cache=${Date.now()}`;
      
      // Update the image
      retryImgElement.src = urlWithCacheBuster;
    } else {
      console.log(`Still could not find preview image for node ${nodeId} after retry`);
    }
  }, 50);
  
  console.log(`Could not find preview image for node ${nodeId} on first attempt`);
  return false;
}

// Make this accessible globally for debugging
(window as any).updateNodePreviewDirectly = updateNodePreviewDirectly;