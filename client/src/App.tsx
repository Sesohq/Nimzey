import React from 'react';
import { Route, Switch } from 'wouter';
import { ReactFlowProvider } from 'reactflow';
import { ThemeProvider } from './components/ui/theme-provider';
import Home from './pages/Home';

const App = () => {
  return (
    <ReactFlowProvider>
      <ThemeProvider defaultTheme="dark" storageKey="filterkit-theme">
        <Switch>
          <Route path="/" component={Home} />
        </Switch>
      </ThemeProvider>
    </ReactFlowProvider>
  );
};

export default App;