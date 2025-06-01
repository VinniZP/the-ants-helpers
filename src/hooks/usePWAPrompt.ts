import { useState, useEffect } from "react";
import { usePWAInstall } from "./usePWAInstall";

const PWA_PROMPT_KEY = "pwa-prompt-data";
const VISITS_THRESHOLD = 2; // Show after 2 visits
const REMINDER_INTERVAL = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds

interface PWAPromptData {
  visitCount: number;
  lastPromptTime: number;
  dismissed: boolean;
  installed: boolean;
}

/**
 * Hook to manage automatic PWA installation prompts
 */
export function usePWAPrompt() {
  const { canInstall, isInstalled } = usePWAInstall();
  const [shouldShowPrompt, setShouldShowPrompt] = useState(false);

  useEffect(() => {
    // Don't show if already installed or can't install
    if (isInstalled || !canInstall) {
      return;
    }

    const stored = localStorage.getItem(PWA_PROMPT_KEY);
    let promptData: PWAPromptData = {
      visitCount: 0,
      lastPromptTime: 0,
      dismissed: false,
      installed: false,
    };

    if (stored) {
      try {
        promptData = JSON.parse(stored);
      } catch (error) {
        console.warn("Failed to parse PWA prompt data:", error);
      }
    }

    // If already marked as installed, don't show
    if (promptData.installed) {
      return;
    }

    // Increment visit count
    promptData.visitCount += 1;

    const now = Date.now();
    const timeSinceLastPrompt = now - promptData.lastPromptTime;

    // Show prompt if:
    // 1. User has visited enough times AND
    // 2. Either hasn't been prompted before OR enough time has passed since last reminder
    const shouldShow =
      promptData.visitCount >= VISITS_THRESHOLD &&
      (!promptData.dismissed || timeSinceLastPrompt > REMINDER_INTERVAL);

    if (shouldShow) {
      // Small delay to let the page load first
      const timer = setTimeout(() => {
        setShouldShowPrompt(true);
      }, 3000);

      return () => clearTimeout(timer);
    }

    // Save updated visit count
    localStorage.setItem(PWA_PROMPT_KEY, JSON.stringify(promptData));
  }, [canInstall, isInstalled]);

  const dismissPrompt = (remindLater = true) => {
    setShouldShowPrompt(false);

    const stored = localStorage.getItem(PWA_PROMPT_KEY);
    let promptData: PWAPromptData = {
      visitCount: 0,
      lastPromptTime: 0,
      dismissed: false,
      installed: false,
    };

    if (stored) {
      try {
        promptData = JSON.parse(stored);
      } catch (error) {
        console.warn("Failed to parse PWA prompt data:", error);
      }
    }

    promptData.dismissed = true;
    promptData.lastPromptTime = Date.now();

    // If user doesn't want to be reminded, set a very far future date
    if (!remindLater) {
      promptData.lastPromptTime = Date.now() + 365 * 24 * 60 * 60 * 1000; // 1 year
    }

    localStorage.setItem(PWA_PROMPT_KEY, JSON.stringify(promptData));
  };

  const markAsInstalled = () => {
    setShouldShowPrompt(false);

    const promptData: PWAPromptData = {
      visitCount: 0,
      lastPromptTime: 0,
      dismissed: false,
      installed: true,
    };

    localStorage.setItem(PWA_PROMPT_KEY, JSON.stringify(promptData));
  };

  return {
    shouldShowPrompt,
    dismissPrompt,
    markAsInstalled,
  };
}
