import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { ReactFlowProvider } from "reactflow";
import 'reactflow/dist/style.css';
import '@/components/ui/styled-button.css';
import '@/components/ui/orange-button.css';
import '@/components/ui/category-button.css';
import '@/components/ui/category-headers.css';
import '@/components/ui/glitch-button.css';
import '@/components/ui/filter-panel.css';

createRoot(document.getElementById("root")!).render(
  <ReactFlowProvider>
    <App />
  </ReactFlowProvider>
);
