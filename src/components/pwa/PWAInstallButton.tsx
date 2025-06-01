import { useState } from "react";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Download, Smartphone, CheckCircle } from "lucide-react";
import { cn } from "../../lib/utils";
import { usePWAInstall } from "../../hooks/usePWAInstall";
import { PWAInstallPopup } from "./PWAInstallPopup";

interface PWAInstallButtonProps {
  variant?: "compact" | "full";
  className?: string;
}

export function PWAInstallButton({
  variant = "compact",
  className,
}: PWAInstallButtonProps) {
  const { canInstall, isInstalled } = usePWAInstall();
  const [showPopup, setShowPopup] = useState(false);

  // Don't show anything if app is already installed
  if (isInstalled) {
    return variant === "full" ? (
      <Badge variant="secondary" className={cn("text-xs", className)}>
        <CheckCircle className="w-3 h-3 mr-1" />
        App Installed
      </Badge>
    ) : null;
  }

  // Don't show if installation is not available
  if (!canInstall) {
    return null;
  }

  const handleClick = () => {
    setShowPopup(true);
  };

  if (variant === "compact") {
    return (
      <>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleClick}
          className={cn(
            "h-8 px-3 text-xs font-medium hover:bg-blue-50 hover:text-blue-700 transition-colors",
            className
          )}
          title="Install App"
        >
          <Download className="w-3 h-3 mr-1" />
          Install
        </Button>

        {showPopup && <PWAInstallPopup onClose={() => setShowPopup(false)} />}
      </>
    );
  }

  return (
    <>
      <Button
        variant="outline"
        onClick={handleClick}
        className={cn(
          "h-10 px-4 text-sm font-medium border-blue-200 text-blue-700 hover:bg-blue-50",
          className
        )}
      >
        <Smartphone className="w-4 h-4 mr-2" />
        Install App
      </Button>

      {showPopup && <PWAInstallPopup onClose={() => setShowPopup(false)} />}
    </>
  );
}
