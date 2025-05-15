import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { ReactFlowProvider } from "reactflow";
import 'reactflow/dist/style.css';
import '@/components/ui/styled-button.css';
import '@/components/ui/orange-button.css';
import '@/components/ui/category-button.css';

createRoot(document.getElementById("root")!).render(
  <ReactFlowProvider>
    <App />
  </ReactFlowProvider>
);
