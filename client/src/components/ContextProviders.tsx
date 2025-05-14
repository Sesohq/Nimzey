import React, { createContext } from 'react';

// Create a separate component for the context
export const SourceImageContext = createContext<HTMLImageElement | null>(null);