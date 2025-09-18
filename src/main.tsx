import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import { ToastProvider } from "./Components/ToastContext";
import { NavigationProvider } from "./Components/NavigationContext";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <ToastProvider>
        <NavigationProvider>
          {" "}
          {/* ✅ Wrap App inside this */}
          <App />
        </NavigationProvider>
      </ToastProvider>
    </BrowserRouter>
  </StrictMode>
);
