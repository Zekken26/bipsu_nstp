
  import { createRoot } from "react-dom/client";
  import App from "./App.tsx";
  import AppErrorBoundary from "./components/common/AppErrorBoundary";
  import "./styles/index.css";

  createRoot(document.getElementById("root")!).render(
    <AppErrorBoundary>
      <App />
    </AppErrorBoundary>
  );
  
