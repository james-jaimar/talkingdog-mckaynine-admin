
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Ensure there's a DOM element with id "root"
const rootElement = document.getElementById("root");

if (!rootElement) {
  console.error("Failed to find the root element");
  const rootDiv = document.createElement("div");
  rootDiv.id = "root";
  document.body.appendChild(rootDiv);
}

createRoot(document.getElementById("root")!).render(<App />);
