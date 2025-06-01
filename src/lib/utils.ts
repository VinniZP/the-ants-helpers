import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Get the correct asset path with base URL support for GitHub Pages deployment
 * @param path - Asset path relative to public directory (e.g., "/raspberry.png")
 * @returns Full asset path with base URL prefix
 */
export function getAssetPath(path: string): string {
  const baseUrl = import.meta.env.BASE_URL;

  // Remove leading slash from path if present to avoid double slashes
  const cleanPath = path.startsWith("/") ? path.slice(1) : path;

  // Combine base URL with the asset path
  // Base URL already includes trailing slash when needed
  return `${baseUrl}${cleanPath}`;
}
