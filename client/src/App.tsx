import React, { useState } from 'react';
import { ReactFlowProvider } from 'reactflow';
import 'reactflow/dist/style.css';
import NodeEditor from './NodeEditor';

const App = () => {
  const [showEditor, setShowEditor] = useState(false);
  
  // This is a simple placeholder app to showcase the transition from prototype to actual implementation
  const PrototypeView = () => (
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
              
              {/* More filter categories here */}
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
            
            {/* Launch button */}
            <div className="p-6 bg-white/50 rounded-lg border shadow-sm max-w-md backdrop-blur-sm" style={{ position: 'absolute', bottom: '20px', right: '20px' }}>
              <h2 className="text-base font-semibold mb-2">Node Architecture</h2>
              <ul className="list-disc list-inside text-xs text-gray-600 space-y-1">
                <li>Color-coded connections based on data types</li>
                <li>Parameters can link to other node outputs</li>
                <li>Preview updates in real-time</li>
              </ul>
              <div className="pt-2 mt-2 flex justify-center">
                <button
                  className="px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors cursor-pointer"
                  onClick={() => setShowEditor(true)}
                >
                  Launch Editor
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
        </div>
      </div>
    </div>
  );

  return (
    <ReactFlowProvider>
      {showEditor ? <NodeEditor /> : <PrototypeView />}
    </ReactFlowProvider>
  );
};

export default App;