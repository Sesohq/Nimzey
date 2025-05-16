# Troubleshooting Guide

This document provides solutions for common issues when working with Filter Kit.

## Node Connection Issues

### Problem: Nodes Won't Connect

**Possible Causes:**
1. Attempting to create a circular connection (cycle)
2. Connecting incompatible parameter types
3. Connection would cross too many existing connections

**Solutions:**
- Check the console for error messages about cycles
- Ensure parameters have compatible types (float → float, etc.)
- Rearrange nodes to create cleaner connection paths
- Make sure you're connecting from an output to an input handle

### Problem: Parameter Connections Not Working

**Possible Causes:**
1. Parameter is already connected to another source
2. Parameter types are incompatible
3. Connection would create a cycle

**Solutions:**
- Disconnect the parameter first if it's already connected
- Check that both parameters have the same type
- Verify that the connection won't create a circular dependency

## Image Processing Issues

### Problem: Image Processing Is Slow

**Possible Causes:**
1. Large image size overwhelming the browser
2. Complex filter chain with many nodes
3. Computationally intensive filters (blur with large radius, etc.)

**Solutions:**
- Use smaller images for faster processing
- Break complex chains into smaller groups
- Reduce parameter values for intensive filters
- Check if Web Workers are running properly

### Problem: Filter Preview Not Updating

**Possible Causes:**
1. Browser performance limitations
2. Error in the filter processing chain
3. Image data not being properly passed between nodes

**Solutions:**
- Check browser console for errors
- Verify that all nodes in the chain are working individually
- Try disconnecting and reconnecting nodes
- Refresh the page if Web Workers get stuck

## UI/UX Issues

### Problem: Nodes Disappearing or Jumping

**Possible Causes:**
1. ReactFlow positioning issues
2. Browser zoom level affecting calculations
3. Conflicts with other draggable elements

**Solutions:**
- Use the "Reset View" option to recenter the canvas
- Ensure browser zoom is at 100%
- Check for error messages about node positioning

### Problem: Upload Image Not Working

**Possible Causes:**
1. File type not supported
2. File too large for browser memory
3. Issues with file input handling

**Solutions:**
- Use common image formats (JPG, PNG, WebP)
- Reduce image size before uploading
- Try both upload methods (button and node)
- Check browser console for file-related errors

## Performance Optimization

### Tips for Better Performance

1. **Image Size Management**
   - Use images under 2000x2000 pixels for best performance
   - Resize large images before importing

2. **Filter Chain Optimization**
   - Place computationally intensive filters (blur, glow) at the end of chains
   - Use fewer nodes by combining similar effects
   - Consider splitting complex graphs into multiple parts

3. **Browser Considerations**
   - Chrome and Firefox generally offer best performance
   - Close other tabs to free up memory
   - Use dedicated GPU if available

## Technical Issues

### Browser Compatibility

Filter Kit works best on:
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

Older browsers may experience:
- Slower processing
- UI rendering issues
- Web Worker limitations

### Memory Usage

Filter Kit uses browser memory for image processing. If you encounter crashes:
1. Reduce image size
2. Use fewer filter nodes
3. Close other memory-intensive tabs
4. Restart the browser

### Console Errors

Common error messages and solutions:

1. `Cannot read property of undefined` - Usually indicates a missing parameter or disconnected node
2. `Maximum call stack exceeded` - May indicate a cycle in the node graph
3. `Out of memory` - Image processing exceeding browser's memory limits
4. ReactFlow warnings about nodeTypes - Normal behavior, can be ignored