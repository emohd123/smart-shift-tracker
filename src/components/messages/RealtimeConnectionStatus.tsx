import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Wifi, WifiOff, AlertCircle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface RealtimeConnectionStatusProps {
  status: 'connecting' | 'connected' | 'disconnected' | 'error';
  className?: string;
}

export default function RealtimeConnectionStatus({ 
  status, 
  className 
}: RealtimeConnectionStatusProps) {
  // Only show in development mode
  if (import.meta.env.PROD) {
    return null;
  }

  const getStatusConfig = () => {
    switch (status) {
      case 'connected':
        return {
          icon: Wifi,
          label: 'Connected',
          variant: 'default' as const,
          className: 'bg-green-500/10 text-green-600 border-green-500/20'
        };
      case 'connecting':
        return {
          icon: Loader2,
          label: 'Connecting...',
          variant: 'secondary' as const,
          className: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20 animate-spin'
        };
      case 'disconnected':
        return {
          icon: WifiOff,
          label: 'Disconnected',
          variant: 'secondary' as const,
          className: 'bg-gray-500/10 text-gray-600 border-gray-500/20'
        };
      case 'error':
        return {
          icon: AlertCircle,
          label: 'Connection Error',
          variant: 'destructive' as const,
          className: 'bg-red-500/10 text-red-600 border-red-500/20'
        };
      default:
        return {
          icon: WifiOff,
          label: 'Unknown',
          variant: 'secondary' as const,
          className: ''
        };
    }
  };

  const config = getStatusConfig();
  const Icon = config.icon;

  return (
    <Badge
      variant={config.variant}
      className={cn(
        "flex items-center gap-1.5 text-xs font-normal px-2 py-1",
        config.className,
        className
      )}
      title={`Real-time connection status: ${status}`}
    >
      <Icon className="h-3 w-3" />
      <span>{config.label}</span>
    </Badge>
  );
}
