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

// Handle GitHub Pages SPA redirect
// Check if we were redirected from 404.html with a preserved path
const handleGitHubPagesRedirect = () => {
  const urlParams = new URLSearchParams(window.location.search);
  const redirectPath = urlParams.get("p");

  if (redirectPath) {
    // Remove the redirect parameter from the URL and navigate to the intended path
    const url = new URL(window.location.href);
    url.searchParams.delete("p");

    // Replace the current history entry with the intended path
    const newPath = import.meta.env.BASE_URL + redirectPath.substring(1);
    window.history.replaceState(null, "", newPath + url.search + url.hash);
  }
};

// Handle the redirect before setting up the router
handleGitHubPagesRedirect();

// Get base path for TanStack Router
const getBasePath = () => {
  // Use Vite's BASE_URL which is automatically set based on config
  const basePath = import.meta.env.BASE_URL;

  // Normalize the base path - ensure it starts with / and doesn't end with / (unless it's just '/')
  if (basePath === "/") {
    return "/";
  }

  let normalized = basePath;
  if (!normalized.startsWith("/")) {
    normalized = "/" + normalized;
  }
  if (normalized.endsWith("/") && normalized.length > 1) {
    normalized = normalized.slice(0, -1);
  }

  return normalized;
};

const basePath = getBasePath();
console.log("TanStack Router base path:", basePath);
console.log("Vite BASE_URL:", import.meta.env.BASE_URL);

// Create a new router instance
const router = createRouter({
  routeTree,
  context: {},
  basepath: basePath, // Configure TanStack Router with the correct base path
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
