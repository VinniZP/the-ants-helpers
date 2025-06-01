import React from "react";
import { Button } from "./button";
import { Badge } from "./badge";

interface NotificationBannerProps {
  permission: NotificationPermission;
  onRequestPermission: () => Promise<void>;
  onDismiss: () => void;
  isVisible: boolean;
}

export const NotificationBanner: React.FC<NotificationBannerProps> = ({
  permission,
  onRequestPermission,
  onDismiss,
  isVisible,
}) => {
  if (!isVisible || permission === "granted") {
    return null;
  }

  const getBannerContent = () => {
    switch (permission) {
      case "denied":
        return {
          title: "Notifications Blocked",
          description:
            "Enable notifications in your browser settings to receive reminders.",
          action: "Open Settings",
          variant: "destructive" as const,
          icon: (
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18.364 5.636M5.636 18.364l12.728-12.728"
              />
            </svg>
          ),
        };
      default:
        return {
          title: "Enable Notifications",
          description:
            "Get timely reminders for your scheduled tasks and events.",
          action: "Allow Notifications",
          variant: "default" as const,
          icon: (
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 17h5l-5 5v-5z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M11 21H5a2 2 0 01-2-2V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v7a2 2 0 01-2 2z"
              />
            </svg>
          ),
        };
    }
  };

  const handleAction = () => {
    if (permission === "denied") {
      // Guide user to browser settings
      alert(
        'To enable notifications:\n\n1. Click the lock icon in your address bar\n2. Select "Allow" for notifications\n3. Refresh the page'
      );
    } else {
      onRequestPermission();
    }
  };

  const content = getBannerContent();

  return (
    <div className="fixed top-14 left-0 right-0 z-40 mx-4 mt-2">
      <div
        className={`rounded-lg border p-4 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/90 shadow-lg ${
          content.variant === "destructive"
            ? "border-destructive/20"
            : "border-border"
        }`}
      >
        <div className="flex items-start space-x-3">
          <div
            className={`flex-shrink-0 ${
              content.variant === "destructive"
                ? "text-destructive"
                : "text-primary"
            }`}
          >
            {content.icon}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2 mb-1">
              <h4 className="font-medium text-sm">{content.title}</h4>
              <Badge variant={content.variant} className="text-xs">
                {permission === "denied" ? "Blocked" : "Setup Required"}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mb-3">
              {content.description}
            </p>

            <div className="flex items-center space-x-2">
              <Button
                size="sm"
                variant={content.variant}
                onClick={handleAction}
                className="text-xs"
              >
                {content.action}
              </Button>

              <Button
                size="sm"
                variant="ghost"
                onClick={onDismiss}
                className="text-xs"
              >
                Maybe Later
              </Button>
            </div>
          </div>

          <Button
            size="sm"
            variant="ghost"
            onClick={onDismiss}
            className="flex-shrink-0 h-8 w-8 p-0"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
            <span className="sr-only">Dismiss</span>
          </Button>
        </div>
      </div>
    </div>
  );
};
