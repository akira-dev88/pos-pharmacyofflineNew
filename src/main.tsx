import "./index.css";
import React from "react";
import ReactDOM from "react-dom/client";
import { HashRouter as BrowserRouter } from "react-router-dom";
import App from "./App";
import { AuthProvider } from "./context/AuthContext";
import LicenseGate from './components/LicenseGate';
import './i18n';
import { ThemeProvider } from "next-themes";   // 👈 import

ReactDOM.createRoot(document.getElementById("root")!).render(
  <BrowserRouter>
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
      <LicenseGate>
        <AuthProvider>
          <App />
        </AuthProvider>
      </LicenseGate>
    </ThemeProvider>
  </BrowserRouter>
);