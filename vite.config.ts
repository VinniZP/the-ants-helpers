import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(({}) => {
  // Set base path for GitHub Pages deployment
  const isGitHubPages = process.env.GITHUB_PAGES === "true";
  const base = isGitHubPages ? "/the-ants-helpers/" : "/";

  console.log("Environment GITHUB_PAGES:", process.env.GITHUB_PAGES);
  console.log("Environment NODE_ENV:", process.env.NODE_ENV);
  console.log("Base path being used:", base);

  return {
    base,
    plugins: [
      react(),
      tailwindcss(),
      VitePWA({
        registerType: "autoUpdate",
        base: base,
        devOptions: {
          enabled: true,
          type: "module",
          navigateFallback: "index.html",
        },
        workbox: {
          globPatterns: ["**/*.{js,css,html,ico,png,svg}"],
          runtimeCaching: [
            {
              urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
              handler: "CacheFirst",
              options: {
                cacheName: "google-fonts-cache",
                expiration: {
                  maxEntries: 10,
                  maxAgeSeconds: 60 * 60 * 24 * 365, // <== 365 days
                },
                cacheableResponse: {
                  statuses: [0, 200],
                },
              },
            },
          ],
        },
        includeAssets: [
          "favicon.ico",
          "apple-touch-icon.png",
          "masked-icon.svg",
        ],
        manifest: {
          name: "The Ants Event Scheduler",
          short_name: "Ants Scheduler",
          description:
            "Game event scheduler PWA for The Ants Underground Kingdom",
          theme_color: "#000000",
          background_color: "#ffffff",
          display: "standalone",
          orientation: "portrait",
          scope: base,
          start_url: base,
          icons: [
            {
              src: "pwa-192x192.png",
              sizes: "192x192",
              type: "image/png",
            },
            {
              src: "pwa-512x512.png",
              sizes: "512x512",
              type: "image/png",
            },
            {
              src: "pwa-512x512.png",
              sizes: "512x512",
              type: "image/png",
              purpose: "any maskable",
            },
          ],
        },
      }),
    ],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
  };
});
