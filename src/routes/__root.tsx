import { Outlet, createRootRoute } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import { MobileLayout } from "../components/layout/MobileLayout";
import { NotificationBanner } from "../components/ui/notification-banner";
import { AddReminderDialog } from "../components/reminders/AddReminderDialog";
import { PWAInstallPopup } from "../components/pwa/PWAInstallPopup";
import { useState, useEffect } from "react";
import { NotificationService } from "../services/notificationService";
import { initializeDatabase } from "../data/database";
import { usePWAPrompt } from "../hooks/usePWAPrompt";

export const Route = createRootRoute({
  component: RootComponent,
});

function RootComponent() {
  const [notificationPermission, setNotificationPermission] =
    useState<NotificationPermission>("default");
  const [showNotificationBanner, setShowNotificationBanner] = useState(false);
  const [notificationService, setNotificationService] =
    useState<NotificationService | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // PWA prompt management
  const { shouldShowPrompt, dismissPrompt, markAsInstalled } = usePWAPrompt();

  useEffect(() => {
    // Initialize database on app start
    initializeDatabase();

    // Initialize notification service
    const service = NotificationService.getInstance();
    setNotificationService(service);

    // Check notification permission status
    if ("Notification" in window) {
      setNotificationPermission(Notification.permission);

      // Show banner if permission not granted
      if (Notification.permission !== "granted") {
        // Delay showing banner to let UI load first
        setTimeout(() => {
          setShowNotificationBanner(true);
        }, 1000);
      }
    }

    // Check for missed notifications and reschedule
    service.checkMissedNotifications();
    service.rescheduleAllActiveReminders();
  }, []);

  const handleRequestNotificationPermission = async () => {
    if (!notificationService) return;

    try {
      const permission = await notificationService.requestPermission();
      setNotificationPermission(permission);

      if (permission === "granted") {
        setShowNotificationBanner(false);

        // Reschedule all reminders now that we have permission
        await notificationService.rescheduleAllActiveReminders();

        // Show success feedback
        console.log("Notifications enabled! Your reminders are now scheduled.");
      }
    } catch (error) {
      console.error("Error requesting notification permission:", error);
    }
  };

  const handleDismissBanner = () => {
    setShowNotificationBanner(false);

    // Show again after 24 hours if still not granted
    if (notificationPermission !== "granted") {
      setTimeout(() => {
        setShowNotificationBanner(true);
      }, 24 * 60 * 60 * 1000); // 24 hours
    }
  };

  const handleAddReminderClick = () => {
    setShowAddDialog(true);
  };

  const handleReminderAdded = () => {
    // Trigger refresh of reminder lists
    setRefreshTrigger((prev) => prev + 1);
  };

  const handlePWAInstallClose = () => {
    dismissPrompt(true); // Remind later
  };

  const handlePWAInstalled = () => {
    markAsInstalled();
  };

  return (
    <>
      <MobileLayout
        notificationPermission={notificationPermission}
        onAddReminderClick={handleAddReminderClick}
      >
        <NotificationBanner
          permission={notificationPermission}
          onRequestPermission={handleRequestNotificationPermission}
          onDismiss={handleDismissBanner}
          isVisible={showNotificationBanner}
        />

        <div key={refreshTrigger}>
          <Outlet />
        </div>
      </MobileLayout>

      <AddReminderDialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        onReminderAdded={handleReminderAdded}
      />

      {/* Automatic PWA Install Prompt */}
      {shouldShowPrompt && (
        <PWAInstallPopup
          onClose={handlePWAInstallClose}
          onInstalled={handlePWAInstalled}
        />
      )}

      <TanStackRouterDevtools />
    </>
  );
}
