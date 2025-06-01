import { useState } from "react";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import {
  X,
  Download,
  Smartphone,
  Zap,
  Wifi,
  Bell,
  Home,
  CheckCircle,
} from "lucide-react";
import { cn } from "../../lib/utils";
import { usePWAInstall } from "../../hooks/usePWAInstall";

interface PWAInstallPopupProps {
  onClose: () => void;
  onInstalled?: () => void;
  className?: string;
}

export function PWAInstallPopup({
  onClose,
  onInstalled,
  className,
}: PWAInstallPopupProps) {
  const { canInstall, promptInstall, isInstalled } = usePWAInstall();
  const [isInstalling, setIsInstalling] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleInstall = async () => {
    setIsInstalling(true);
    try {
      const success = await promptInstall();
      if (success) {
        setShowSuccess(true);
        onInstalled?.();
        setTimeout(() => {
          onClose();
        }, 2000);
      }
    } catch (error) {
      console.error("Install failed:", error);
    } finally {
      setIsInstalling(false);
    }
  };

  const features = [
    {
      icon: Smartphone,
      title: "Home Screen Access",
      description: "Add to your home screen for quick access",
    },
    {
      icon: Zap,
      title: "Lightning Fast",
      description: "Instant loading with offline caching",
    },
    {
      icon: Wifi,
      title: "Works Offline",
      description: "Access your schedule even without internet",
    },
    {
      icon: Bell,
      title: "Push Notifications",
      description: "Get reminded of upcoming game events",
    },
  ];

  // Show success message if already installed
  if (isInstalled || showSuccess) {
    return (
      <div
        className={cn(
          "fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4",
          className
        )}
      >
        <Card className="w-full max-w-md mx-auto shadow-2xl animate-in fade-in-0 zoom-in-95 duration-300">
          <CardContent className="p-6 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-green-800 mb-2">
              App Installed Successfully!
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              The Ants Scheduler is now available on your home screen.
            </p>
            <Button onClick={onClose} className="w-full">
              Get Started
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4",
        className
      )}
    >
      <Card className="w-full max-w-lg mx-auto shadow-2xl animate-in fade-in-0 zoom-in-95 duration-300">
        <CardHeader className="relative pb-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="absolute top-2 right-2 h-6 w-6 p-0"
          >
            <X className="h-4 w-4" />
          </Button>

          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Home className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <CardTitle className="text-xl">Install Ants Scheduler</CardTitle>
              <Badge variant="secondary" className="text-xs mt-1">
                Progressive Web App
              </Badge>
            </div>
          </div>

          <p className="text-gray-600 text-sm">
            Get the full app experience with enhanced performance and offline
            access.
          </p>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Features Grid */}
          <div className="grid grid-cols-2 gap-4">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div key={index} className="text-center space-y-2">
                  <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center mx-auto">
                    <Icon className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-medium text-sm">{feature.title}</h4>
                    <p className="text-xs text-gray-500 leading-tight">
                      {feature.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Installation Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Download className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm">
                <p className="font-medium text-blue-800 mb-1">
                  Install without app stores
                </p>
                <p className="text-blue-600 text-xs leading-relaxed">
                  This app installs directly to your device. No App Store or
                  Google Play required. It's safe, secure, and takes up minimal
                  space.
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col gap-3 pt-2">
            {canInstall ? (
              <Button
                onClick={handleInstall}
                disabled={isInstalling}
                className="w-full h-12 text-base font-medium"
              >
                {isInstalling ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    Installing...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4 mr-2" />
                    Install App
                  </>
                )}
              </Button>
            ) : (
              <div className="text-center space-y-2">
                <p className="text-sm text-gray-600">
                  Installation not available on this device or browser.
                </p>
                <p className="text-xs text-gray-500">
                  Try using Chrome, Edge, or Safari on mobile devices.
                </p>
              </div>
            )}

            <div className="flex gap-2">
              <Button variant="outline" onClick={onClose} className="flex-1">
                Maybe Later
              </Button>

              <Button
                variant="ghost"
                onClick={() => {
                  // Mark as "don't remind" by calling onClose without remindLater
                  onClose();
                }}
                className="flex-1 text-gray-500 hover:text-gray-700"
                size="sm"
              >
                Don't Ask Again
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
