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
  
  console.log(`Could not find preview image for node ${nodeId}`);
  return false;
}

// Make this accessible globally for debugging
(window as any).updateNodePreviewDirectly = updateNodePreviewDirectly;