import React, { useState, useCallback } from 'react';
import { ReactFlowProvider } from 'reactflow';
import 'reactflow/dist/style.css';

// Simple placeholder app to showcase the core node architecture
const App = () => {
  return (
    <ReactFlowProvider>
      <div className="h-screen flex flex-col">
        <header className="bg-gray-900 text-white p-4">
          <h1 className="text-lg font-bold">FilterKit</h1>
          <p className="text-sm text-gray-300">Node-based image filtering system</p>
        </header>
        
        <div className="flex-1 flex">
          <div className="w-1/4 p-4 bg-gray-50 border-r">
            <h2 className="text-lg font-semibold mb-3">Filter Nodes</h2>
            <p className="text-sm text-gray-500 mb-4">
              The filter panel will display all available nodes categorized by type.
            </p>
            <div className="p-4 bg-white rounded-md border shadow-sm">
              <h3 className="font-medium mb-2">Filter Categories</h3>
              <ul className="space-y-3 text-sm">
                <li className="p-3 bg-blue-50 rounded flex items-center border border-blue-100">
                  <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white mr-3">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-4 h-4">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <div className="font-medium">Image Sources</div>
                    <div className="text-xs text-blue-700 mt-1">Provides image input</div>
                  </div>
                </li>
                
                <li className="p-3 bg-green-50 rounded flex items-center border border-green-100">
                  <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center text-white mr-3">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-4 h-4">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                    </svg>
                  </div>
                  <div>
                    <div className="font-medium">Filters</div>
                    <div className="text-xs text-green-700 mt-1">Transform image appearance</div>
                  </div>
                </li>
                
                <li className="p-3 bg-purple-50 rounded flex items-center border border-purple-100">
                  <div className="w-8 h-8 rounded-full bg-purple-500 flex items-center justify-center text-white mr-3">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-4 h-4">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                  </div>
                  <div>
                    <div className="font-medium">Compositing</div>
                    <div className="text-xs text-purple-700 mt-1">Combine multiple images</div>
                  </div>
                </li>
                
                <li className="p-3 bg-yellow-50 rounded flex items-center border border-yellow-100">
                  <div className="w-8 h-8 rounded-full bg-yellow-500 flex items-center justify-center text-white mr-3">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-4 h-4">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                    </svg>
                  </div>
                  <div>
                    <div className="font-medium">Adjustments</div>
                    <div className="text-xs text-yellow-700 mt-1">Modify image properties</div>
                  </div>
                </li>
                
                <li className="p-3 bg-gray-50 rounded flex items-center border border-gray-200">
                  <div className="w-8 h-8 rounded-full bg-gray-500 flex items-center justify-center text-white mr-3">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-4 h-4">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                    </svg>
                  </div>
                  <div>
                    <div className="font-medium">Output</div>
                    <div className="text-xs text-gray-600 mt-1">Final image result</div>
                  </div>
                </li>
              </ul>
            </div>
          </div>
          
          <div className="flex-1 p-4 bg-gray-100 flex flex-col">
            <div className="flex-1 flex items-center justify-center relative">
              {/* Node visualization */}
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 flex items-center">
                {/* Image node */}
                <div className="w-48 bg-white border rounded-md shadow-md mr-16 relative overflow-hidden">
                  <div className="p-2 bg-blue-500 text-white text-xs font-medium">Image Source</div>
                  <div className="p-3">
                    <div className="h-20 bg-gray-50 rounded flex items-center justify-center">
                      <svg className="h-10 w-10 text-gray-300" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  </div>
                  {/* Output port */}
                  <div className="absolute right-0 top-1/2 transform translate-x-1/2 -translate-y-1/2">
                    <div className="w-4 h-4 bg-blue-500 rounded-full border-2 border-white"></div>
                  </div>
                </div>
                
                {/* Connection line */}
                <div className="w-16 h-1 bg-blue-500"></div>
                
                {/* Filter node */}
                <div className="w-48 bg-white border rounded-md shadow-md relative overflow-hidden">
                  <div className="p-2 bg-green-500 text-white text-xs font-medium">Blur Filter</div>
                  <div className="p-3">
                    <div className="text-xs text-gray-600 mb-1">Radius</div>
                    <div className="h-2 bg-gray-200 rounded-full mb-3">
                      <div className="h-2 bg-green-500 rounded-full" style={{ width: '60%' }}></div>
                    </div>
                    <div className="text-xs text-gray-600 mb-1">Blend Mode</div>
                    <div className="h-6 bg-gray-50 border rounded text-xs px-2 flex items-center">
                      Normal
                    </div>
                  </div>
                  {/* Input port */}
                  <div className="absolute left-0 top-1/2 transform -translate-x-1/2 -translate-y-1/2">
                    <div className="w-4 h-4 bg-blue-500 rounded-full border-2 border-white"></div>
                  </div>
                  {/* Output port */}
                  <div className="absolute right-0 top-1/2 transform translate-x-1/2 -translate-y-1/2">
                    <div className="w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
                  </div>
                </div>
              </div>
              
              {/* Background helper text */}
              <div className="p-6 bg-white/50 rounded-lg border shadow-sm max-w-md backdrop-blur-sm" style={{ position: 'absolute', bottom: '20px', right: '20px' }}>
                <h2 className="text-base font-semibold mb-2">Node Architecture</h2>
                <ul className="list-disc list-inside text-xs text-gray-600 space-y-1">
                  <li>Color-coded connections based on data types</li>
                  <li>Parameters can link to other node outputs</li>
                  <li>Preview updates in real-time</li>
                </ul>
                <div className="pt-2 mt-2 flex justify-center">
                  <button
                    className="px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                    onClick={() => alert("Ready to implement the node-based architecture!")}
                  >
                    Start Building
                  </button>
                </div>
              </div>
            </div>
          </div>
          
          <div className="w-1/4 p-4 bg-gray-50 border-l">
            <h2 className="text-lg font-semibold mb-3">Preview</h2>
            <p className="text-sm text-gray-500 mb-4">
              The preview panel will display the processed results of your filter chain.
            </p>
            <div className="bg-white border rounded-md overflow-hidden">
              <div className="p-2 bg-gray-100 border-b text-xs font-medium">
                Current Output
              </div>
              <div className="h-48 p-3 flex items-center justify-center">
                <div className="text-center text-gray-400">
                  <svg className="mx-auto h-12 w-12 text-gray-300" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <p className="mt-2">No image selected</p>
                </div>
              </div>
            </div>
            <div className="mt-4">
              <h3 className="font-medium text-sm mb-2">Node Properties</h3>
              <div className="bg-white border rounded-md overflow-hidden">
                <div className="p-2 bg-blue-100 border-b text-xs font-medium flex items-center justify-between">
                  <span>Blur Filter</span>
                  <div className="flex space-x-1">
                    <span className="inline-block w-3 h-3 rounded-full bg-blue-500"></span>
                    <span className="inline-block w-3 h-3 rounded-full bg-green-500"></span>
                  </div>
                </div>
                <div className="p-3">
                  <div className="mb-3">
                    <label className="block text-xs text-gray-600 mb-1">Radius</label>
                    <div className="flex items-center">
                      <div className="inline-block w-3 h-3 rounded-full bg-green-500 mr-2"></div>
                      <div className="h-2 bg-gray-200 rounded-full flex-1">
                        <div className="h-2 bg-green-500 rounded-full" style={{ width: '60%' }}></div>
                      </div>
                      <span className="ml-2 text-xs font-mono">5.4</span>
                    </div>
                  </div>
                  
                  <div className="mb-3">
                    <label className="block text-xs text-gray-600 mb-1">Mode</label>
                    <div className="flex text-xs">
                      <div className="border border-gray-200 rounded-l px-2 py-1 bg-blue-50">Gaussian</div>
                      <div className="border-t border-b border-gray-200 px-2 py-1">Box</div>
                      <div className="border border-gray-200 rounded-r px-2 py-1">Motion</div>
                    </div>
                  </div>
                  
                  <div className="mb-3">
                    <label className="block text-xs text-gray-600 mb-1">Blend</label>
                    <div className="flex items-center">
                      <div className="inline-block w-3 h-3 rounded-full bg-blue-500 mr-2"></div>
                      <select className="text-xs border border-gray-200 rounded py-1 px-2 bg-white">
                        <option>Normal</option>
                        <option>Multiply</option>
                        <option>Screen</option>
                      </select>
                    </div>
                  </div>
                  
                  <div>
                    <label className="flex items-center">
                      <input type="checkbox" defaultChecked className="mr-2" readOnly />
                      <span className="text-xs">High Quality</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ReactFlowProvider>
  );
};

export default App;