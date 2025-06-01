import React from "react";
import { useRouterState } from "@tanstack/react-router";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Link } from "@tanstack/react-router";
import { Calendar, Plus, Settings, Gamepad2 } from "lucide-react";

interface MobileLayoutProps {
  children: React.ReactNode;
  notificationPermission?: NotificationPermission;
  onAddReminderClick: () => void;
}

export const MobileLayout: React.FC<MobileLayoutProps> = ({
  children,
  notificationPermission = "default",
  onAddReminderClick,
}) => {
  const routerState = useRouterState();
  const currentPath = routerState.location.pathname;

  const getPermissionStatus = () => {
    switch (notificationPermission) {
      case "granted":
        return {
          text: "Notifications On",
          variant: "default" as const,
          color: "bg-green-500",
        };
      case "denied":
        return {
          text: "Notifications Off",
          variant: "destructive" as const,
          color: "bg-red-500",
        };
      default:
        return {
          text: "Setup Notifications",
          variant: "secondary" as const,
          color: "bg-yellow-500",
        };
    }
  };

  const permissionStatus = getPermissionStatus();

  const navigationItems = [
    {
      path: "/",
      label: "Today",
      icon: Calendar,
      description: "Today's events",
    },
    {
      path: "/schedule",
      label: "Schedule",
      icon: Gamepad2,
      description: "Game events",
    },
    {
      path: "/custom",
      label: "Custom",
      icon: Plus,
      description: "Custom reminders",
    },
    {
      path: "/notifications",
      label: "Settings",
      icon: Settings,
      description: "App settings",
    },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-14 lg:h-16 items-center justify-between px-4 lg:px-6">
          <div className="flex items-center space-x-2">
            <h1 className="font-semibold text-lg lg:text-xl">Ants Scheduler</h1>
          </div>

          {/* Desktop Navigation - Top horizontal */}
          <nav className="hidden lg:flex items-center space-x-6">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentPath === item.path;

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground ${
                    isActive
                      ? "bg-accent text-accent-foreground"
                      : "text-muted-foreground"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <Badge
            variant={permissionStatus.variant}
            className="text-xs lg:text-sm"
          >
            <div
              className={`w-2 h-2 rounded-full ${permissionStatus.color} mr-1`}
            />
            {permissionStatus.text}
          </Badge>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 pb-20 lg:pb-6 lg:px-6 lg:py-6">{children}</main>

      {/* Floating Action Button - Desktop positioning */}
      <Button
        onClick={onAddReminderClick}
        size="lg"
        className="fixed bottom-20 lg:bottom-6 right-4 lg:right-6 h-12 w-12 lg:h-14 lg:w-14 rounded-full shadow-lg z-40 lg:hover:shadow-xl transition-shadow"
      >
        <Plus className="h-6 w-6" />
        <span className="sr-only">Add Reminder</span>
      </Button>

      {/* Bottom Navigation - Mobile only */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-30 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/90">
        <div className="flex items-center justify-around h-16">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPath === item.path;

            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex flex-col items-center py-2 px-3 text-xs transition-colors min-w-0 ${
                  isActive
                    ? "text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon className="w-5 h-5 mb-1" />
                <span className="truncate">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
};
