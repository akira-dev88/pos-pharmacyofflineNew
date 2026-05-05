import "./index.css";
import React from "react";
import ReactDOM from "react-dom/client";
import { HashRouter as BrowserRouter } from "react-router-dom";
import App from "./App";
import { AuthProvider } from "./context/AuthContext";
import LicenseGate from './components/LicenseGate';

ReactDOM.createRoot(document.getElementById("root")!).render(
  <BrowserRouter>
    <LicenseGate>
      <AuthProvider>
        <App />
      </AuthProvider>
    </LicenseGate>
  </BrowserRouter>
);