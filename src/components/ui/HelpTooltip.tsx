import { HelpCircle } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface HelpTooltipProps {
  content: string;
  side?: "top" | "bottom" | "left" | "right";
  className?: string;
  iconClassName?: string;
}

export function HelpTooltip({
  content,
  side = "top",
  className,
  iconClassName,
}: HelpTooltipProps) {
  return (
    <TooltipProvider>
      <Tooltip delayDuration={200}>
        <TooltipTrigger asChild>
          <button
            type="button"
            className={cn(
              "inline-flex items-center justify-center rounded-full focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
              className
            )}
            aria-label="Help"
          >
            <HelpCircle
              className={cn(
                "h-4 w-4 text-muted-foreground hover:text-foreground transition-colors",
                iconClassName
              )}
            />
          </button>
        </TooltipTrigger>
        <TooltipContent
          side={side}
          className="max-w-[300px] text-sm z-50"
        >
          <p>{content}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

interface LabelWithTooltipProps {
  label: string;
  tooltip: string;
  htmlFor?: string;
  required?: boolean;
  className?: string;
}

export function LabelWithTooltip({
  label,
  tooltip,
  htmlFor,
  required,
  className,
}: LabelWithTooltipProps) {
  return (
    <div className={cn("flex items-center gap-1.5", className)}>
      <label
        htmlFor={htmlFor}
        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
      >
        {label}
        {required && <span className="text-destructive ml-1">*</span>}
      </label>
      <HelpTooltip content={tooltip} />
    </div>
  );
}
