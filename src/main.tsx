
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';
import { Toaster } from 'sonner';

// Ensure there's a DOM element with id "root"
const rootElement = document.getElementById("root");

if (!rootElement) {
  console.error("Failed to find the root element");
  const rootDiv = document.createElement("div");
  rootDiv.id = "root";
  document.body.appendChild(rootDiv);
}

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
    <Toaster position="top-right" richColors />
  </React.StrictMode>
);
