import { StrictMode } from "react";
import ReactDOM from "react-dom/client";
import { RouterProvider, createRouter } from "@tanstack/react-router";

// Import the generated route tree
import { routeTree } from "./routeTree.gen";

import "./styles.css";
import reportWebVitals from "./reportWebVitals.ts";

// Register service worker for PWA functionality
async function registerServiceWorker() {
  if ("serviceWorker" in navigator) {
    try {
      // In development, register service worker manually
      await navigator.serviceWorker.register("/dev-sw.js?dev-sw");
      console.log("Service Worker registered successfully");
    } catch (error) {
      // Service worker registration failed (expected in development)
      // This is normal when dev-sw.js doesn't exist
    }
  }
}

// Register service worker
registerServiceWorker();

// Get base path from document base element or fall back to import.meta.env.BASE_URL
const getBasePath = () => {
  // Check if we have a base element in the document
  const baseElement = document.querySelector("base");
  if (baseElement && baseElement.href) {
    const url = new URL(baseElement.href);
    return url.pathname;
  }

  // Fall back to Vite's BASE_URL
  return import.meta.env.BASE_URL || "/";
};

const basePath = getBasePath();
console.log("TanStack Router base path:", basePath);

// Create a new router instance
const router = createRouter({
  routeTree,
  context: {},
  basepath: basePath, // Add base path for GitHub Pages compatibility
  defaultPreload: "intent",
  scrollRestoration: true,
  defaultStructuralSharing: true,
  defaultPreloadStaleTime: 0,
});

// Register the router instance for type safety
declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

// Render the app
const rootElement = document.getElementById("app");
if (rootElement && !rootElement.innerHTML) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <StrictMode>
      <RouterProvider router={router} />
    </StrictMode>
  );
}

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
