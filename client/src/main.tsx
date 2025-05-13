import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { ReactFlowProvider } from "reactflow";
import 'reactflow/dist/style.css';

createRoot(document.getElementById("root")!).render(
  <ReactFlowProvider>
    <App />
  </ReactFlowProvider>
);
